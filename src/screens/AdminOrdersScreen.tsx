import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminOrder, OrderStatus, Driver } from "../types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  QueryConstraint,
  writeBatch,
} from "firebase/firestore";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { useToast } from "../contexts/ToastContext";
import SortableHeader from "../components/SortableHeader";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";

const getStatusPillClasses = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Delivered:
      return {
        dot: "bg-green-500",
        select:
          "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500/50 dark:border-green-500/70",
      };
    case OrderStatus.Preparing:
      return {
        dot: "bg-yellow-500",
        select:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-500/50 dark:border-yellow-500/70",
      };
    case OrderStatus.ReadyForPickup:
      return {
        dot: "bg-purple-500",
        select:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-500/50 dark:border-purple-500/70",
      };
    case OrderStatus.OutForDelivery:
      return {
        dot: "bg-blue-500",
        select:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-500/50 dark:border-blue-500/70",
      };
    case OrderStatus.Cancelled:
      return {
        dot: "bg-red-500",
        select:
          "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-500/50 dark:border-red-500/70",
      };
    default:
      return {
        dot: "bg-slate-400",
        select:
          "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600",
      };
  }
};

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

const AdminOrdersScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    {
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
    }
  );
  const { showToast } = useToast();

  const [searchParams] = useSearchParams();
  const statusFilterFromUrl = searchParams.get("status") as OrderStatus | null;

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(
    statusFilterFromUrl || "all"
  );
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState<
    "all" | "delivery" | "pickup"
  >("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    "all" | "paid" | "unpaid"
  >("all");

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const driversQuery = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
      setDrivers(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Driver))
      );
    });
    return () => unsubscribe();
  }, []);

  const filters = useMemo(() => {
    const q: QueryConstraint[] = [];
    if (statusFilter && statusFilter !== "all") {
      q.push(where("status", "==", statusFilter));
    }
    if (deliveryMethodFilter && deliveryMethodFilter !== "all") {
      q.push(where("deliveryMethod", "==", deliveryMethodFilter));
    }
    if (paymentStatusFilter && paymentStatusFilter !== "all") {
      q.push(where("paymentStatus", "==", paymentStatusFilter));
    }
    return q;
  }, [statusFilter, deliveryMethodFilter, paymentStatusFilter]);

  const initialSort = useMemo(
    () => ({ key: "date" as const, direction: "descending" as const }),
    []
  );

  const {
    documents: paginatedOrders,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    requestSort,
    sortConfig,
  } = usePaginatedFirestore<AdminOrder>("orders", initialSort, filters);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return paginatedOrders;
    const lowercasedTerm = searchTerm.toLowerCase();
    return paginatedOrders.filter(
      (order) =>
        (order.deliveryInfo?.name || "")
          .toLowerCase()
          .includes(lowercasedTerm) ||
        order.id.toLowerCase().includes(lowercasedTerm)
    );
  }, [paginatedOrders, searchTerm]);

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleBulkStatusChange = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) {
      showToast("Please select orders to update.", "info");
      return;
    }
    const batch = writeBatch(db);
    selectedOrderIds.forEach((orderId) => {
      const orderRef = doc(db, "orders", orderId);
      batch.update(orderRef, { status: newStatus });
    });
    try {
      await batch.commit();
      logAdminAction(
        adminUser,
        "Bulk Order Status Change",
        `${selectedOrderIds.size} orders -> ${newStatus}`
      );
      showToast(
        `Updated ${selectedOrderIds.size} orders to "${newStatus}".`,
        "success"
      );
      setSelectedOrderIds(new Set());
    } catch (error) {
      console.error("Error updating orders in bulk:", error);
      showToast("Failed to update orders.", "error");
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    const order = paginatedOrders.find((o) => o.id === orderId);
    if (!order) return;
    const oldStatus = order.status;

    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      logAdminAction(
        adminUser,
        "Order Status Changed",
        `Order #${orderId.slice(0, 5)}: ${oldStatus} -> ${newStatus}`
      );
      showToast("Order status updated!", "success");
    } catch (error) {
      showToast("Failed to update order status.", "error");
    }
  };

  const handleDriverAssign = async (
    orderId: string,
    driverId: string | null
  ) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { driverId });
      const driverName =
        drivers.find((d) => d.id === driverId)?.name || "Unassigned";
      logAdminAction(
        adminUser,
        "Assigned Driver",
        `Order #${orderId.slice(0, 5)} -> ${driverName}`
      );
      showToast("Driver assigned!", "success");
    } catch (error) {
      showToast("Failed to assign driver.", "error");
    }
  };

  const handleDeleteOrder = (order: AdminOrder) => {
    setConfirmationState({
      isOpen: true,
      title: "تأكيد الحذف",
      message: `هل أنت متأكد من رغبتك في حذف الطلب #${order.id
        .slice(0, 7)
        .toUpperCase()}؟ لا يمكن التراجع عن هذا الإجراء.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "orders", order.id));
          logAdminAction(adminUser, "Deleted Order", `Order ID: ${order.id}`);
          showToast("Order deleted successfully!", "success");
        } catch (err) {
          showToast("Failed to delete order.", "error");
        } finally {
          setConfirmationState({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="إدارة الطلبات"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="ابحث بالاسم أو رقم الطلب..."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as OrderStatus | "all")
            }
            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          >
            <option value="all">كل الحالات</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={deliveryMethodFilter}
            onChange={(e) =>
              setDeliveryMethodFilter(
                e.target.value as "all" | "delivery" | "pickup"
              )
            }
            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          >
            <option value="all">كل طرق الاستلام</option>
            <option value="delivery">توصيل</option>
            <option value="pickup">استلام من المتجر</option>
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(e) =>
              setPaymentStatusFilter(
                e.target.value as "all" | "paid" | "unpaid"
              )
            }
            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
          >
            <option value="all">كل حالات الدفع</option>
            <option value="paid">مدفوع</option>
            <option value="unpaid">غير مدفوع</option>
          </select>
          <select
            onChange={(e) =>
              handleBulkStatusChange(e.target.value as OrderStatus)
            }
            disabled={selectedOrderIds.size === 0}
            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50"
          >
            <option>تغيير حالة المحدد</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <TableSkeleton />
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                  <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="p-3">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={
                            selectedOrderIds.size === filteredOrders.length &&
                            filteredOrders.length > 0
                          }
                        />
                      </th>
                      <SortableHeader<AdminOrder>
                        label="رقم الطلب"
                        sortKey="id"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500">
                        العميل
                      </th>
                      <SortableHeader<AdminOrder>
                        label="الإجمالي"
                        sortKey="total"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500">
                        الحالة
                      </th>
                      <th className="p-3 text-sm font-semibold text-slate-500">
                        السائق
                      </th>
                      <th className="p-3 text-sm font-semibold text-slate-500">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const { select } = getStatusPillClasses(
                        order.status || OrderStatus.Preparing
                      );
                      return (
                        <tr
                          key={order.id}
                          className={`border-b dark:border-slate-700 transition-colors ${
                            selectedOrderIds.has(order.id)
                              ? "bg-sky-100/50 dark:bg-sky-900/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.has(order.id)}
                              onChange={(e) =>
                                handleSelectOrder(order.id, e.target.checked)
                              }
                            />
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                            {order.id.slice(0, 7).toUpperCase()}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {order.deliveryInfo?.name || "غير معروف"}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {(order.total || 0).toLocaleString()} ج.س
                          </td>
                          <td className="p-3">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className={`p-1.5 w-40 text-sm font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-admin-primary ${select}`}
                            >
                              {Object.values(OrderStatus).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={order.driverId || ""}
                              onChange={(e) =>
                                handleDriverAssign(
                                  order.id,
                                  e.target.value || null
                                )
                              }
                              className="p-1.5 w-36 rounded text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            >
                              <option value="">لم يتم التعيين</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 space-x-4 space-x-reverse">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-admin-primary hover:underline"
                            >
                              التفاصيل
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="text-red-500 hover:underline"
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 md:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedOrderIds.has(order.id)}
                        onChange={(e) =>
                          handleSelectOrder(order.id, e.target.checked)
                        }
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">
                              {order.deliveryInfo?.name || "غير معروف"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              #{order.id.slice(0, 7).toUpperCase()}
                            </p>
                          </div>
                          <p className="font-bold text-primary">
                            {(order.total || 0).toLocaleString()} ج.س
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              الحالة:
                            </label>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className={`p-1 w-36 rounded text-xs border focus:ring-admin-primary ${
                                getStatusPillClasses(order.status).select
                              }`}
                            >
                              {Object.values(OrderStatus).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              السائق:
                            </label>
                            <select
                              value={order.driverId || ""}
                              onChange={(e) =>
                                handleDriverAssign(
                                  order.id,
                                  e.target.value || null
                                )
                              }
                              className="p-1 w-36 rounded text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"
                            >
                              <option value="">لم يتم التعيين</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-4 pt-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-admin-primary font-semibold"
                            >
                              التفاصيل
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order)}
                              className="text-red-500 font-semibold"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Pagination
          onNext={nextPage}
          onPrev={prevPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
        />
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          drivers={drivers}
        />
      )}

      <ConfirmationModal
        {...confirmationState}
        onClose={() =>
          setConfirmationState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </>
  );
};

export default AdminOrdersScreen;
