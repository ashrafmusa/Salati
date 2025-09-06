import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { AdminOrder, OrderStatus } from "../types";
import { SpinnerIcon, CheckCircleIcon } from "../assets/icons";
import ConfirmationModal from "../components/ConfirmationModal";

type ActiveTab = "available" | "mine";

const DriverDashboardScreen: React.FC = () => {
  const { user } = useAuth();
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
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({}); // For accept/confirm buttons

  // Fetch driver's assigned orders
  useEffect(() => {
    if (!user) return;
    setLoading((prev) => ({ ...prev, mine: true }));
    const q = query(
      collection(db, "orders"),
      where("driverId", "==", user.uid),
      where("status", "==", OrderStatus.OutForDelivery)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AdminOrder)
        );
        setMyDeliveries(fetchedOrders);
        setLoading((prev) => ({ ...prev, mine: false }));
      },
      (err) => {
        console.error("Error fetching assigned orders:", err);
        setLoading((prev) => ({ ...prev, mine: false }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch available orders for pickup
  useEffect(() => {
    setLoading((prev) => ({ ...prev, available: true }));
    const q = query(
      collection(db, "orders"),
      where("status", "==", OrderStatus.ReadyForPickup)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AdminOrder)
        );
        setAvailableOrders(fetchedOrders);
        setLoading((prev) => ({ ...prev, available: false }));
      },
      (err) => {
        console.error("Error fetching available orders:", err);
        setLoading((prev) => ({ ...prev, available: false }));
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAcceptOrder = async (order: AdminOrder) => {
    if (!user) return;
    setIsSubmitting((prev) => ({ ...prev, [order.id]: true }));

    const orderRef = doc(db, "orders", order.id);
    try {
      await runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (
          !orderDoc.exists() ||
          orderDoc.data()?.status !== OrderStatus.ReadyForPickup
        ) {
          throw new Error("Order is no longer available.");
        }
        transaction.update(orderRef, {
          status: OrderStatus.OutForDelivery,
          driverId: user.uid,
        });
      });
    } catch (error: any) {
      console.error("Error accepting order:", error);
      alert(
        error.message ||
          "Failed to accept order. It may have been taken by another driver."
      );
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  const handleConfirmDelivery = async () => {
    if (!confirmingOrder) return;
    setIsSubmitting((prev) => ({ ...prev, [confirmingOrder.id]: true }));
    try {
      await updateDoc(doc(db, "orders", confirmingOrder.id), {
        status: OrderStatus.Delivered,
        paymentStatus: "paid",
      });
    } catch (error) {
      console.error("Error confirming delivery:", error);
      alert("Failed to confirm delivery. Please try again.");
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [confirmingOrder.id]: false }));
      setConfirmingOrder(null);
    }
  };

  const TabButton: React.FC<{
    tab: ActiveTab;
    label: string;
    count: number;
  }> = ({ tab, label, count }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-3 text-center font-bold transition-all duration-300 border-b-2 ${
        activeTab === tab
          ? "text-admin-primary border-admin-primary"
          : "text-slate-500 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
      }`}
    >
      {label}{" "}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          activeTab === tab
            ? "bg-admin-primary text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        }`}
      >
        {count}
      </span>
    </button>
  );

  const OrderCard: React.FC<{ order: AdminOrder; isAvailable?: boolean }> = ({
    order,
    isAvailable = false,
  }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md border-r-4 border-admin-primary">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex-grow">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            طلب #{order.id.slice(0, 7).toUpperCase()}
          </p>
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
          <p className="text-3xl font-bold text-status-delivered">
            {order.total.toLocaleString()} ج.س
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t dark:border-slate-700">
        {isAvailable ? (
          <button
            onClick={() => handleAcceptOrder(order)}
            disabled={isSubmitting[order.id]}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting[order.id] ? (
              <SpinnerIcon className="w-6 h-6 animate-spin" />
            ) : (
              "قبول الطلب"
            )}
          </button>
        ) : (
          <button
            onClick={() => setConfirmingOrder(order)}
            className="w-full bg-admin-primary hover:bg-admin-primary-hover text-white font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-6 h-6" />
            تأكيد التوصيل والدفع
          </button>
        )}
      </div>
    </div>
  );

  const EmptyState: React.FC<{ title: string; message: string }> = ({
    title,
    message,
  }) => (
    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
      <CheckCircleIcon className="w-24 h-24 text-green-500 mx-auto" />
      <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6 flex-shrink-0">
        <div className="flex border-b dark:border-slate-700">
          <TabButton
            tab="available"
            label="الطلبات المتاحة"
            count={availableOrders.length}
          />
          <TabButton tab="mine" label="توصيلاتي" count={myDeliveries.length} />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto space-y-6">
        {activeTab === "available" &&
          (loading.available ? (
            <SpinnerIcon className="w-8 h-8 text-admin-primary animate-spin mx-auto mt-10" />
          ) : availableOrders.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات متاحة"
              message="تحقق مرة أخرى قريبًا للحصول على مهام توصيل جديدة."
            />
          ) : (
            availableOrders.map((order) => (
              <OrderCard key={order.id} order={order} isAvailable />
            ))
          ))}

        {activeTab === "mine" &&
          (loading.mine ? (
            <SpinnerIcon className="w-8 h-8 text-admin-primary animate-spin mx-auto mt-10" />
          ) : myDeliveries.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات للتوصيل"
              message="يمكنك قبول الطلبات من قسم 'الطلبات المتاحة'."
            />
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
        cancelText="إلغاء"
      />
    </div>
  );
};

// FIX: Added default export to fix lazy loading issue.
export default DriverDashboardScreen;
