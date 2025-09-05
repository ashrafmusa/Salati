import React, { useState, useMemo, useEffect } from 'react';
import { AdminOrder, OrderStatus, Driver } from '../types';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { db } from '../firebase/config';

const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered: return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', border: 'border-green-500'};
        case OrderStatus.Preparing: return { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-500' };
        case OrderStatus.OutForDelivery: return { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-500' };
        case OrderStatus.Cancelled: return { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', border: 'border-red-500' };
        default: return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-500' };
    }
}

const AdminOrdersScreen: React.FC = () => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

    useEffect(() => {
        const unsubscribeOrders = db.collection('orders')
            .orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                const fetchedOrders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AdminOrder[];
                setOrders(fetchedOrders);
                setLoading(false);
            }, err => {
                console.error("Error fetching orders:", err);
                setLoading(false);
            });

        const unsubscribeDrivers = db.collection('drivers').onSnapshot(snapshot => {
            const fetchedDrivers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Driver[];
            setDrivers(fetchedDrivers);
        });
        
        return () => {
            unsubscribeOrders();
            unsubscribeDrivers();
        };
    }, []);

    const handleUpdateOrder = async (orderId: string, newStatus: OrderStatus, newDriverId: string | null) => {
        const orderRef = db.collection('orders').doc(orderId);
        try {
            await orderRef.update({
                status: newStatus,
                driverId: newDriverId || null
            });
        } catch (error) {
            console.error("Error updating order:", error);
        }
    };
    
    const filteredOrders = useMemo(() => {
        return orders
            .filter(o => filter === 'all' || o.status === filter)
            .filter(o => 
                o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.deliveryInfo.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [orders, filter, searchTerm]);
    
    const inputSelectClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-admin-primary focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";

    return (
        <>
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 self-start sm:self-center">قائمة الطلبات</h2>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
                        <input 
                            type="text"
                            placeholder="ابحث بالرقم أو اسم العميل..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full sm:w-64 ${inputSelectClasses}`}
                        />
                        <select 
                            value={filter}
                            onChange={e => setFilter(e.target.value as OrderStatus | 'all')}
                            className={`w-full sm:w-auto ${inputSelectClasses}`}
                        >
                            <option value="all">كل الحالات</option>
                            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? <p>Loading orders...</p> : (
                <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">رقم الطلب</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">العميل</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الإجمالي</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الحالة</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">السائق</th>
                                <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => {
                                const statusClasses = getStatusClasses(order.status);
                                return (
                                <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-3 font-medium text-gray-700 dark:text-gray-200">{order.id.slice(0, 7).toUpperCase()}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{order.deliveryInfo.name}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{order.total} ج.س</td>
                                    <td className="p-3 w-40">
                                        <select 
                                            value={order.status} 
                                            onChange={e => handleUpdateOrder(order.id, e.target.value as OrderStatus, order.driverId || null)}
                                            className={`p-1 w-full rounded text-sm border-gray-300 dark:border-gray-600 focus:ring-admin-primary focus:border-admin-primary ${statusClasses.bg} ${statusClasses.text}`}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3 w-40">
                                        <select 
                                            value={order.driverId || ''} 
                                            onChange={e => handleUpdateOrder(order.id, order.status, e.target.value || null)}
                                            className="p-1 w-full rounded text-sm border-gray-300 dark:border-gray-600 focus:ring-admin-primary focus:border-admin-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <option value="">اختر سائق</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => setSelectedOrder(order)} 
                                            className="bg-admin-primary text-white px-3 py-1 text-sm rounded hover:bg-admin-primary-hover transition-colors"
                                        >
                                            التفاصيل
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {filteredOrders.map(order => {
                        const statusClasses = getStatusClasses(order.status);
                        return (
                        <div key={order.id} className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${statusClasses.border}`}>
                           <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{order.id.slice(0, 7).toUpperCase()}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.deliveryInfo.name}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses.bg} ${statusClasses.text}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{order.total} ج.س</p>
                            
                            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md border dark:border-gray-700">
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">تغيير الحالة:</label>
                                    <select 
                                        value={order.status} 
                                        onChange={e => handleUpdateOrder(order.id, e.target.value as OrderStatus, order.driverId || null)}
                                        className={`p-2 w-full rounded text-sm border-gray-300 dark:border-gray-600 focus:ring-admin-primary focus:border-admin-primary ${statusClasses.bg} ${statusClasses.text}`}
                                    >
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">تعيين سائق:</label>
                                    <select 
                                        value={order.driverId || ''} 
                                        onChange={e => handleUpdateOrder(order.id, order.status, e.target.value || null)}
                                        className={`p-2 w-full rounded text-sm ${inputSelectClasses}`}
                                    >
                                        <option value="">اختر سائق</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedOrder(order)} 
                                className="w-full mt-4 bg-admin-primary/10 text-admin-primary font-semibold px-3 py-2 text-sm rounded hover:bg-admin-primary/20 transition-colors"
                            >
                                عرض التفاصيل
                            </button>
                        </div>
                    )})}
                </div>
                </>
                )}

            </div>
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} drivers={drivers} />}
        </>
    );
};

export default AdminOrdersScreen;