import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { AdminOrder, OrderStatus } from "../types";
// FIX: Moved ExclamationTriangleIcon import to the correct file ('../assets/adminIcons').
import { SpinnerIcon, CheckCircleIcon } from "../assets/icons";
import { MessageIcon, ExclamationTriangleIcon } from "../assets/adminIcons";
import ConfirmationModal from "../components/ConfirmationModal";
import { addOrderLog } from "../utils/orderLogger";
import DriverNoteModal from "../components/DriverNoteModal";
import { useToast } from "../contexts/ToastContext";

type ActiveTab = "available" | "mine";

const DriverDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [myDeliveries, setMyDeliveries] = useState<AdminOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<Record<ActiveTab, boolean>>({
    available: true,
    mine: true,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>("available");

  const [confirmingOrder, setConfirmingOrder] = useState<AdminOrder | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  // State for note-taking modal
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    order: AdminOrder | null;
    type: "note" | "issue";
  }>({ isOpen: false, order: null, type: "note" });

  useEffect(() => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, mine: true }));
    const q = db
      .collection("orders")
      .where("driverId", "==", user.uid)
      .where("status", "==", OrderStatus.OutForDelivery);
    const unsubscribe = q.onSnapshot((snapshot) => {
      const fetchedOrders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as AdminOrder)
      );
      setMyDeliveries(fetchedOrders);
      setLoading((prev) => ({ ...prev, mine: false }));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setLoading((prev) => ({ ...prev, available: true }));
    const q = db
      .collection("orders")
      .where("status", "==", OrderStatus.ReadyForPickup)
      .where("deliveryMethod", "==", "delivery");
    const unsubscribe = q.onSnapshot((snapshot) => {
      const fetchedOrders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as AdminOrder)
      );
      setAvailableOrders(fetchedOrders);
      setLoading((prev) => ({ ...prev, available: false }));
    });
    return () => unsubscribe();
  }, []);

  const handleAcceptOrder = async (order: AdminOrder) => {
    if (!user) return;
    setIsSubmitting((prev) => ({ ...prev, [order.id]: true }));
    const orderRef = db.collection("orders").doc(order.id);
    try {
      await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (
          !orderDoc.exists ||
          orderDoc.data()?.status !== OrderStatus.ReadyForPickup
        ) {
          throw new Error("Order is no longer available.");
        }
        transaction.update(orderRef, {
          status: OrderStatus.OutForDelivery,
          driverId: user.uid,
        });
      });
      await addOrderLog(
        order.id,
        user,
        `السائق استلم الطلب وهو في طريقه للتوصيل.`,
        "system_log",
        "internal"
      );
    } catch (error: any) {
      showToast(error.message || "Failed to accept order.", "error");
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirmingOrder || !user) return;
    setIsSubmitting((prev) => ({ ...prev, [confirmingOrder.id]: true }));
    try {
      await db.collection("orders").doc(confirmingOrder.id).update({
        status: OrderStatus.Delivered,
        paymentStatus: "paid",
      });
      await addOrderLog(
        confirmingOrder.id,
        user,
        `تم توصيل الطلب بنجاح.`,
        "system_log",
        "internal"
      );
    } catch (error) {
      showToast("Failed to confirm delivery.", "error");
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [confirmingOrder.id]: false }));
      setConfirmingOrder(null);
    }
  };

  const handleAddNote = async (note: string) => {
    if (!noteModal.order || !user) return;
    const { order, type } = noteModal;
    const logType = type === "note" ? "driver_note" : "issue";
    const notification =
      type === "issue"
        ? {
            message: `مشكلة عاجلة بخصوص الطلب #${order.id.slice(
              0,
              7
            )}: ${note}`,
            link: `/orders?view=${order.id}`,
          }
        : undefined;
    await addOrderLog(order.id, user, note, logType, "internal", notification);
    showToast(
      type === "note" ? "تمت إضافة الملاحظة" : "تم إرسال المشكلة للإدارة",
      "success"
    );
  };

  const OrderCard: React.FC<{ order: AdminOrder; isAvailable?: boolean }> = ({
    order,
    isAvailable = false,
  }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md border-r-4 border-admin-primary">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex-grow">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {order.deliveryInfo.name}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            {order.deliveryInfo.address}
          </p>
          <p
            className="text-slate-600 dark:text-slate-300 font-semibold"
            dir="ltr"
          >
            {order.deliveryInfo.phone}
          </p>
        </div>
        <div className="text-left sm:text-right flex-shrink-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            المبلغ المطلوب
          </p>
          <p className="text-3xl font-bold text-green-500">
            {order.total.toLocaleString()} ج.س
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-2">
        {isAvailable ? (
          <button
            onClick={() => handleAcceptOrder(order)}
            disabled={isSubmitting[order.id]}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center"
          >
            {isSubmitting[order.id] ? (
              <SpinnerIcon className="w-6 h-6 animate-spin" />
            ) : (
              "قبول الطلب"
            )}
          </button>
        ) : (
          <>
            <button
              onClick={() => setConfirmingOrder(order)}
              className="w-full bg-admin-primary hover:bg-admin-primary-hover text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-6 h-6" /> تأكيد التوصيل والدفع
            </button>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setNoteModal({ isOpen: true, order, type: "note" })
                }
                className="flex-1 bg-slate-200 dark:bg-slate-700 font-semibold py-2 rounded-md flex items-center justify-center gap-2"
              >
                <MessageIcon className="w-5 h-5" />
                إضافة ملاحظة
              </button>
              <button
                onClick={() =>
                  setNoteModal({ isOpen: true, order, type: "issue" })
                }
                className="flex-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 font-semibold py-2 rounded-md flex items-center justify-center gap-2"
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
                إبلاغ عن مشكلة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6 flex-shrink-0">
        <div className="flex border-b dark:border-slate-700">
          <button
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-3 font-bold border-b-2 ${
              activeTab === "available"
                ? "text-admin-primary border-admin-primary"
                : "text-slate-500 border-transparent"
            }`}
          >
            الطلبات المتاحة{" "}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              {availableOrders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex-1 py-3 font-bold border-b-2 ${
              activeTab === "mine"
                ? "text-admin-primary border-admin-primary"
                : "text-slate-500 border-transparent"
            }`}
          >
            توصيلاتي{" "}
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              {myDeliveries.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-6 pb-4">
        {activeTab === "available" &&
          (loading.available ? (
            <SpinnerIcon className="w-8 h-8 text-admin-primary animate-spin mx-auto mt-10" />
          ) : (
            availableOrders.map((order) => (
              <OrderCard key={order.id} order={order} isAvailable />
            ))
          ))}
        {activeTab === "mine" &&
          (loading.mine ? (
            <SpinnerIcon className="w-8 h-8 text-admin-primary animate-spin mx-auto mt-10" />
          ) : (
            myDeliveries.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ))}
      </div>

      <ConfirmationModal
        isOpen={!!confirmingOrder}
        onClose={() => setConfirmingOrder(null)}
        onConfirm={handleConfirmDelivery}
        title="تأكيد العملية"
        message={`هل تؤكد أنك قمت بتوصيل الطلب #${confirmingOrder?.id
          .slice(0, 7)
          .toUpperCase()} واستلمت مبلغ ${confirmingOrder?.total.toLocaleString()} ج.س نقدًا؟`}
        confirmText={
          isSubmitting[confirmingOrder?.id || ""]
            ? "جارِ التأكيد..."
            : "نعم، أؤكد"
        }
      />
      <DriverNoteModal
        isOpen={noteModal.isOpen}
        onClose={() =>
          setNoteModal({ isOpen: false, order: null, type: "note" })
        }
        onSubmit={handleAddNote}
        title={noteModal.type === "note" ? "إضافة ملاحظة" : "الإبلاغ عن مشكلة"}
      />
    </div>
  );
};

export default DriverDashboardScreen;
