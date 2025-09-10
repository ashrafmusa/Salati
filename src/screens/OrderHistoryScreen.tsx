import React, { useState, useEffect } from "react";
import SubPageHeader from "../components/SubPageHeader";
import { Order, OrderStatus } from "../types";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase/config";
import "firebase/compat/firestore";
import { calculateItemAndExtrasTotal } from "../utils/helpers";
import OrderHistorySkeleton from "../components/OrderHistorySkeleton";
import OrderActivityLog from "../components/OrderActivityLog";
import { SupportIcon } from "../assets/icons";
import { CloseIcon } from "../assets/adminIcons";

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Delivered:
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case OrderStatus.Preparing:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case OrderStatus.Cancelled:
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  }
};

const OrderCard: React.FC<{ order: Order; onSupportClick: () => void }> = ({
  order,
  onSupportClick,
}) => {
  const date = new Date(order.date).toLocaleDateString("ar-EG");

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">
            طلب #{order.id.slice(0, 7).toUpperCase()}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{date}</p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        {order.items.map((item) => (
          <div
            key={item.cartId}
            className="flex justify-between text-slate-600 dark:text-slate-300 text-sm"
          >
            <span>
              {item.arabicName} (x{item.quantity})
            </span>
            <span>{calculateItemAndExtrasTotal(item) * item.quantity} ج.س</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-700 text-slate-900 dark:text-slate-50 mt-2">
        <span>الإجمالي</span>
        <span>{order.total} ج.س</span>
      </div>
      <div className="mt-4 pt-2 border-t dark:border-slate-700">
        <button
          onClick={onSupportClick}
          className="w-full text-center text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-2"
        >
          <SupportIcon className="w-5 h-5" />
          <span>تواصل مع الدعم بخصوص هذا الطلب</span>
        </button>
      </div>
    </div>
  );
};

const OrderSupportModal: React.FC<{ order: Order; onClose: () => void }> = ({
  order,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="font-bold">الدعم للطلب #{order.id.slice(0, 7)}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-grow overflow-hidden">
          <OrderActivityLog orderId={order.id} userRole="customer" />
        </div>
      </div>
    </div>
  );
};

const OrderHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportOrder, setSupportOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersQuery = db
      .collection("orders")
      .where("userId", "==", user.uid)
      .orderBy("date", "desc");

    const unsubscribe = ordersQuery.onSnapshot((snapshot) => {
      const userOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];
      setOrders(userOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      <SubPageHeader title="طلباتي" backPath="/profile" />
      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <OrderHistorySkeleton />
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSupportClick={() => setSupportOrder(order)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 mt-8">
            لا يوجد طلبات سابقة.
          </p>
        )}
      </div>
      {supportOrder && (
        <OrderSupportModal
          order={supportOrder}
          onClose={() => setSupportOrder(null)}
        />
      )}
    </div>
  );
};

export default OrderHistoryScreen;
