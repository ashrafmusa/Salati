import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { OrdersIcon, BasketsIcon, CustomersIcon } from '../assets/adminIcons';
import { AdminOrder, OrderStatus, User, Basket } from '../types';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case OrderStatus.Preparing: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case OrderStatus.OutForDelivery: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case OrderStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
}

const AdminDashboardScreen: React.FC = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        newOrders: 0,
        customerCount: 0,
        lowStockItems: 0,
    });
    const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribers = [
            db.collection('orders').onSnapshot(snapshot => {
                const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminOrder));
                const totalRevenue = orders
                    .filter(o => o.status === OrderStatus.Delivered)
                    .reduce((sum, order) => sum + order.total, 0);
                const newOrders = orders.filter(o => o.status === OrderStatus.Preparing).length;
                
                const sortedRecent = orders
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5);

                setStats(prev => ({ ...prev, totalRevenue, newOrders }));
                setRecentOrders(sortedRecent);
                setLoading(false);
            }),
            db.collection('users').where('role', '==', 'customer').onSnapshot(snapshot => {
                setStats(prev => ({ ...prev, customerCount: snapshot.size }));
            }),
            db.collection('baskets').onSnapshot(snapshot => {
                const baskets = snapshot.docs.map(doc => doc.data() as Basket);
                const lowStockItems = baskets.filter(b => (b.stock || 0) < 20).length;
                setStats(prev => ({ ...prev, lowStockItems }));
            })
        ];

        return () => unsubscribers.forEach(unsub => unsub());
    }, []);


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي الإيرادات" 
          value={loading ? '...' : `${stats.totalRevenue.toLocaleString()}`} 
          icon={<span className="font-bold text-5xl">ج.س</span>}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard 
          title="الطلبات الجديدة" 
          value={loading ? '...' : stats.newOrders} 
          icon={<OrdersIcon />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard 
          title="العملاء" 
          value={loading ? '...' : stats.customerCount} 
          icon={<CustomersIcon />}
          gradient="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard 
          title="منتجات تحتاج إعادة تخزين" 
          value={loading ? '...' : stats.lowStockItems} 
          icon={<BasketsIcon />}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">أحدث الطلبات</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead>
                    <tr className="border-b dark:border-gray-700">
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">رقم الطلب</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">العميل</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجمالي</th>
                        <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                        <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr>
                    ) : recentOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="p-3 font-medium text-gray-700 dark:text-gray-200">{order.id.slice(0, 7).toUpperCase()}</td>
                            <td className="p-3 text-gray-600 dark:text-gray-300">{order.deliveryInfo.name}</td>
                            <td className="p-3 text-gray-600 dark:text-gray-300">{order.total.toLocaleString()} ج.س</td>
                            <td className="p-3">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;