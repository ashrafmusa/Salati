import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminOrder, OrderStatus, Driver } from "../types";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { useToast } from "../contexts/ToastContext";
import { useSortableData } from "../hooks/useSortableData";
import SortableHeader from "../components/SortableHeader";

const getStatusPillClasses = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Delivered:
      return {
        dot: "bg-status-delivered",
        select:
          "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500/50 dark:border-green-500/70",
      };
    case OrderStatus.Preparing:
      return {
        dot: "bg-status-preparing",
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
        dot: "bg-status-delivering",
        select:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-500/50 dark:border-blue-500/70",
      };
    case OrderStatus.Cancelled:
      return {
        dot: "bg-status-cancelled",
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
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (statusFilterFromUrl) {
      setStatusFilter(statusFilterFromUrl);
    }
  }, [statusFilterFromUrl]);

  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("date", "desc")
    );
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AdminOrder[];
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      }
    );

    const unsubscribeDrivers = onSnapshot(
      collection(db, "drivers"),
      (snapshot) => {
        const fetchedDrivers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Driver[];
        setDrivers(fetchedDrivers);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeDrivers();
    };
  }, []);

  const updateOrder = async (orderId: string, updates: Partial<AdminOrder>) => {
    try {
      await updateDoc(doc(db, "orders", orderId), updates);
      showToast("Order updated successfully.", "success");
    } catch (error) {
      console.error("Error updating order:", error);
      showToast("Failed to update order.", "error");
    }
  };

  const handleStatusChange = (order: AdminOrder, newStatus: OrderStatus) => {
    if (order.status === newStatus) return;

    const performUpdate = (
      status: OrderStatus,
      driverId: string | null = order.driverId
    ) => {
      updateOrder(order.id, { status, driverId });
    };

    if (
      order.deliveryMethod === "pickup" &&
      newStatus === OrderStatus.OutForDelivery
    ) {
      showToast("Cannot set 'Out for Delivery' for a pickup order.", "error");
      setTimeout(() => {
        const select = document.getElementById(
          `status-${order.id}`
        ) as HTMLSelectElement;
        if (select) select.value = order.status;
      }, 0);
      return;
    }

    if (
      newStatus === OrderStatus.ReadyForPickup &&
      order.deliveryMethod === "delivery"
    ) {
      performUpdate(newStatus, null);
      return;
    }

    if (
      newStatus === OrderStatus.Delivered ||
      newStatus === OrderStatus.Cancelled
    ) {
      setConfirmationState({
        isOpen: true,
        title: `Confirm Order ${
          newStatus === OrderStatus.Delivered ? "Delivery" : "Cancellation"
        }`,
        message: `Are you sure you want to mark order #${order.id
          .slice(0, 7)
          .toUpperCase()} as ${newStatus}?`,
        onConfirm: () => {
          performUpdate(newStatus);
          setConfirmationState({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {},
          });
        },
        isDestructive: newStatus === OrderStatus.Cancelled,
      });
      setTimeout(() => {
        const select = document.getElementById(
          `status-${order.id}`
        ) as HTMLSelectElement;
        if (select) select.value = order.status;
      }, 0);
      return;
    }

    if (newStatus === OrderStatus.OutForDelivery && !order.driverId) {
      const availableDriver = drivers.find((d) => d.status === "Available");
      if (availableDriver) {
        performUpdate(newStatus, availableDriver.id);
      } else {
        showToast(
          "No available drivers to assign. Please assign a driver manually.",
          "error"
        );
        setTimeout(() => {
          const select = document.getElementById(
            `status-${order.id}`
          ) as HTMLSelectElement;
          if (select) select.value = order.status;
        }, 0);
      }
      return;
    }

    performUpdate(newStatus);
  };

  const handleDriverChange = (orderId: string, newDriverId: string | null) => {
    updateOrder(orderId, { driverId: newDriverId });
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmationState({
      isOpen: true,
      title: "Confirm Deletion",
      message: `Are you sure you want to permanently delete order #${orderId
        .slice(0, 7)
        .toUpperCase()}? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "orders", orderId));
          showToast("Order deleted successfully.", "success");
        } catch (error) {
          console.error("Error deleting order:", error);
          showToast("Failed to delete order.", "error");
        }
        setConfirmationState({
          isOpen: false,
          title: "",
          message: "",
          onConfirm: () => {},
        });
      },
    });
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter(
        (o) =>
          deliveryMethodFilter === "all" ||
          o.deliveryMethod === deliveryMethodFilter
      )
      .filter(
        (o) =>
          paymentStatusFilter === "all" ||
          o.paymentStatus === paymentStatusFilter
      )
      .filter(
        (o) =>
          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (o.deliveryInfo?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
  }, [
    orders,
    statusFilter,
    deliveryMethodFilter,
    paymentStatusFilter,
    searchTerm,
  ]);

  const {
    items: sortedOrders,
    requestSort,
    sortConfig,
  } = useSortableData(filteredOrders, { key: "date", direction: "descending" });

  const inputSelectClasses =
    "p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-admin-primary focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm";

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <AdminScreenHeader
              title="قائمة الطلبات"
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="ابحث بالرقم أو اسم العميل..."
            />
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              className={`w-full sm:w-36 ${inputSelectClasses}`}
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
              className={`w-full sm:w-36 ${inputSelectClasses}`}
            >
              <option value="all">كل طرق الاستلام</option>
              <option value="delivery">توصيل</option>
              <option value="pickup">استلام</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) =>
                setPaymentStatusFilter(
                  e.target.value as "all" | "paid" | "unpaid"
                )
              }
              className={`w-full sm:w-36 ${inputSelectClasses}`}
            >
              <option value="all">كل حالات الدفع</option>
              <option value="paid">مدفوع</option>
              <option value="unpaid">غير مدفوع</option>
            </select>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <p>Loading orders...</p>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                  <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                    <tr>
                      <SortableHeader<AdminOrder>
                        label="رقم الطلب"
                        sortKey="id"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        العميل
                      </th>
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        طريقة الاستلام
                      </th>
                      <SortableHeader<AdminOrder>
                        label="الإجمالي"
                        sortKey="total"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        حالة الطلب
                      </th>
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        السائق
                      </th>
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order, index) => {
                      const statusClasses = getStatusPillClasses(order.status);
                      return (
                        <tr
                          key={order.id}
                          className={`border-b dark:border-slate-700 transition-colors ${
                            index % 2 === 0
                              ? "bg-white dark:bg-slate-800"
                              : "bg-slate-50 dark:bg-slate-800/50"
                          } hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}
                        >
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                            {order.id.slice(0, 7).toUpperCase()}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {order.deliveryInfo.name}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold">
                            {order.deliveryMethod === "pickup"
                              ? "استلام"
                              : "توصيل"}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {order.total.toLocaleString()} ج.س
                          </td>
                          <td className="p-3 w-48">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${statusClasses.dot}`}
                              ></span>
                              <select
                                id={`status-${order.id}`}
                                value={order.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    order,
                                    e.target.value as OrderStatus
                                  )
                                }
                                className={`p-1.5 w-full rounded text-sm border focus:ring-2 focus:ring-admin-primary focus:outline-none font-semibold ${statusClasses.select}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {Object.values(OrderStatus).map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="p-3 w-40">
                            <select
                              value={order.driverId || ""}
                              onChange={(e) =>
                                handleDriverChange(
                                  order.id,
                                  e.target.value || null
                                )
                              }
                              className="p-2 w-full rounded text-sm border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                              onClick={(e) => e.stopPropagation()}
                              disabled={order.deliveryMethod === "pickup"}
                            >
                              <option value="">
                                {order.deliveryMethod === "pickup"
                                  ? "لا يوجد"
                                  : "اختر سائق"}
                              </option>
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
                              className="text-admin-primary hover:underline text-sm font-semibold"
                            >
                              التفاصيل
                            </button>
                            {order.status === OrderStatus.Cancelled && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(order.id);
                                }}
                                className="text-red-500 hover:underline text-sm font-semibold"
                              >
                                حذف
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 md:hidden">
                {sortedOrders.map((order) => {
                  const statusClasses = getStatusPillClasses(order.status);
                  return (
                    <div
                      key={order.id}
                      className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border-l-4 ${statusClasses.dot.replace(
                        "bg-",
                        "border-"
                      )}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            طلب #{order.id.slice(0, 7).toUpperCase()}
                          </p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">
                            {order.deliveryInfo.name}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-primary dark:text-green-400">
                          {order.total.toLocaleString()} ج.س
                        </p>
                      </div>

                      <div className="pt-3 border-t dark:border-slate-700">
                        <div className="mb-3">
                          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                            طريقة الاستلام:
                          </label>
                          <span
                            className={`font-semibold text-slate-700 dark:text-slate-200`}
                          >
                            {order.deliveryMethod === "pickup"
                              ? "استلام من المتجر"
                              : "توصيل للمنزل"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                              حالة الطلب:
                            </label>
                            <select
                              id={`status-mobile-${order.id}`}
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order,
                                  e.target.value as OrderStatus
                                )
                              }
                              className={`p-2 w-full rounded text-sm border focus:ring-admin-primary focus:outline-none font-semibold ${statusClasses.select}`}
                            >
                              {Object.values(OrderStatus).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                              السائق:
                            </label>
                            <select
                              value={order.driverId || ""}
                              onChange={(e) =>
                                handleDriverChange(
                                  order.id,
                                  e.target.value || null
                                )
                              }
                              className={`p-2 w-full rounded text-sm ${inputSelectClasses}`}
                              disabled={order.deliveryMethod === "pickup"}
                            >
                              <option value="">
                                {order.deliveryMethod === "pickup"
                                  ? "لا يوجد"
                                  : "اختر سائق"}
                              </option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t dark:border-slate-700">
                        {order.status === OrderStatus.Cancelled ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="flex-grow bg-admin-primary/10 text-admin-primary font-semibold px-3 py-2 text-sm rounded hover:bg-admin-primary/20 transition-colors"
                            >
                              عرض التفاصيل
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="flex-shrink-0 bg-red-500/10 text-red-500 font-semibold px-4 py-2 text-sm rounded hover:bg-red-500/20 transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="w-full bg-admin-primary/10 text-admin-primary font-semibold px-3 py-2 text-sm rounded hover:bg-admin-primary/20 transition-colors"
                          >
                            عرض التفاصيل
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          drivers={drivers}
        />
      )}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() =>
          setConfirmationState({ ...confirmationState, isOpen: false })
        }
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        isDestructive={confirmationState.isDestructive}
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </>
  );
};

export default AdminOrdersScreen;
