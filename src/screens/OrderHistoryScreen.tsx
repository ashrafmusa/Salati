import React, { useState, useEffect } from 'react';
import SubPageHeader from '../components/SubPageHeader';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/config';
import { calculateItemAndExtrasTotal } from '../utils/helpers';

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered:
            return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case OrderStatus.Preparing:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case OrderStatus.Cancelled:
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
}

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const date = new Date(order.date).toLocaleDateString('ar-EG');

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">طلب #{order.id.slice(0, 7).toUpperCase()}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{date}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>
            <div className="space-y-2 mb-4">
                {order.items.map(item => (
                    <div key={item.cartId} className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                        <span>{item.arabicName} (x{item.quantity})</span>
                        <span>{calculateItemAndExtrasTotal(item, item.selectedExtras) * item.quantity} ج.س</span>
                    </div>
                ))}
            </div>
            {(order.subtotal !== undefined || order.deliveryFee !== undefined || (order.discountAmount && order.discountAmount > 0)) && (
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300 pt-2 border-t dark:border-slate-700">
                    {order.subtotal !== undefined && (
                        <div className="flex justify-between">
                            <span>المجموع الفرعي</span>
                            <span>{order.subtotal} ج.س</span>
                        </div>
                    )}
                    {order.deliveryFee !== undefined && (
                        <div className="flex justify-between">
                            <span>رسوم التوصيل</span>
                            <span>{order.deliveryFee} ج.س</span>
                        </div>
                    )}
                    {order.discountAmount !== undefined && order.discountAmount > 0 && (
                        <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                            <span>الخصم</span>
                            <span>-{order.discountAmount} ج.س</span>
                        </div>
                    )}
                </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-700 text-slate-900 dark:text-slate-50 mt-2">
                <span>الإجمالي</span>
                <span>{order.total} ج.س</span>
            </div>
        </div>
    );
};

const OrderHistoryScreen: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const ordersQuery = db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('date', 'desc');

        const unsubscribe = ordersQuery.onSnapshot((snapshot) => {
            const userOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Order[];
            setOrders(userOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div>
            <SubPageHeader title="طلباتي" backPath="/profile" />
            <div className="p-4 max-w-2xl mx-auto">
                {loading ? (
                     <p className="text-center text-slate-500 dark:text-slate-400 mt-8">جاري تحميل الطلبات...</p>
                ) : orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 dark:text-slate-400 mt-8">لا يوجد طلبات سابقة.</p>
                )}
            </div>
        </div>
    );
};

export default OrderHistoryScreen;