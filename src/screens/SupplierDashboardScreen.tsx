import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import firebase from "firebase/compat/app";
import { useAuth } from "../hooks/useAuth";
import { PurchaseOrder, PurchaseOrderStatus } from "../types";
import { SpinnerIcon } from "../assets/icons";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../contexts/ToastContext";
import { logAdminAction } from "../utils/auditLogger";

const getStatusPillClasses = (status: PurchaseOrderStatus) => {
  switch (status) {
    case PurchaseOrderStatus.FullyReceived:
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case PurchaseOrderStatus.PartiallyReceived:
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300";
    case PurchaseOrderStatus.Sent:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case PurchaseOrderStatus.Draft:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
    case PurchaseOrderStatus.Cancelled:
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  }
};

const ViewPOModal: React.FC<{
  po: PurchaseOrder;
  onClose: () => void;
  onStatusUpdate: (newStatus: PurchaseOrderStatus) => void;
  isUpdating: boolean;
}> = ({ po, onClose, onStatusUpdate, isUpdating }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
        <h2 className="font-bold">أمر الشراء #{po.id.slice(0, 7)}</h2>
        <button onClick={onClose}>&times;</button>
      </header>
      <main className="p-6 flex-grow overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <p>
            <strong>تاريخ الإنشاء:</strong>{" "}
            {new Date(po.createdDate).toLocaleDateString()}
          </p>
          <p>
            <strong>التاريخ المتوقع:</strong>{" "}
            {new Date(po.expectedDate).toLocaleDateString()}
          </p>
          <p>
            <strong>الحالة الحالية:</strong>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs ${getStatusPillClasses(
                po.status
              )}`}
            >
              {po.status}
            </span>
          </p>
          <p>
            <strong>التكلفة الإجمالية:</strong>{" "}
            <span className="font-bold">
              {po.totalCost.toLocaleString()} ج.س
            </span>
          </p>
        </div>
        <div className="border-t dark:border-slate-700 pt-4">
          <h3 className="font-bold mb-2">الأصناف المطلوبة</h3>
          {po.items.map((item) => (
            <div
              key={item.itemId}
              className="flex justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md mb-2"
            >
              <span>{item.itemName}</span>
              <span className="font-semibold">الكمية: {item.quantity}</span>
            </div>
          ))}
        </div>
      </main>
      <footer className="p-4 border-t dark:border-slate-700 flex items-center justify-end gap-3">
        <span className="text-sm font-semibold">تحديث الحالة إلى:</span>
        <select
          value={po.status}
          onChange={(e) =>
            onStatusUpdate(e.target.value as PurchaseOrderStatus)
          }
          disabled={isUpdating}
          className="p-2 border rounded-md"
        >
          <option value={PurchaseOrderStatus.Sent}>مرسل للمورد</option>
          <option value={PurchaseOrderStatus.PartiallyReceived}>
            تم الاستلام جزئياً
          </option>
          <option value={PurchaseOrderStatus.FullyReceived}>
            تم الاستلام بالكامل
          </option>
        </select>
      </footer>
    </div>
  </div>
);

const SupplierDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "supplier" || !user.supplierId) {
      setLoading(false);
      return;
    }

    const q = db
      .collection("purchaseOrders")
      .where("supplierId", "==", user.supplierId)
      .orderBy("createdDate", "desc");

    const unsubscribe = q.onSnapshot(
      (snapshot) => {
        const pos = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as PurchaseOrder)
        );
        setPurchaseOrders(pos);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (newStatus: PurchaseOrderStatus) => {
    if (!viewingPO || !user) return;
    setIsUpdating(true);
    try {
      await db
        .collection("purchaseOrders")
        .doc(viewingPO.id)
        .update({ status: newStatus });
      logAdminAction(
        user,
        "Updated PO Status",
        `PO #${viewingPO.id.slice(0, 7)} -> ${newStatus}`
      );
      showToast("Status updated successfully!", "success");
      setViewingPO((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (error) {
      showToast("Failed to update status.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 animate-spin text-admin-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-4">
        {purchaseOrders.map((po) => (
          <div
            key={po.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md"
          >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  أمر شراء #{po.id.slice(0, 7)}
                </p>
                <p className="text-sm text-slate-500">
                  تاريخ الإنشاء: {new Date(po.createdDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusPillClasses(
                    po.status
                  )}`}
                >
                  {po.status}
                </span>
                <button
                  onClick={() => setViewingPO(po)}
                  className="px-4 py-2 bg-admin-primary text-white text-sm rounded-md"
                >
                  عرض التفاصيل
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {viewingPO && (
        <ViewPOModal
          po={viewingPO}
          onClose={() => setViewingPO(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default SupplierDashboardScreen;
