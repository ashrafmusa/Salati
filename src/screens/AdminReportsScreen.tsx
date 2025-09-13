import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { Order, OrderStatus, Item } from '../types';
import { exportToCsv } from '../utils/helpers';
import { SpinnerIcon } from '../assets/adminIcons';

const AdminReportsScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setLoading(true);
    const startDate = new Date(dateRange.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    const ordersQuery = db.collection('orders')
      .where('date', '>=', startDate.toISOString())
      .where('date', '<=', endDate.toISOString())
      .where('status', '==', OrderStatus.Delivered);

    const itemsQuery = db.collection('items');

    const unsubOrders = ordersQuery.onSnapshot(snapshot => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, () => setLoading(false));

    const unsubItems = itemsQuery.onSnapshot(snapshot => {
        setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)))
    });

    return () => {
        unsubOrders();
        unsubItems();
    };
  }, [dateRange]);

  const salesData = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const newOrders = orders.length;
    const avgOrderValue = newOrders > 0 ? totalRevenue / newOrders : 0;
    return { totalRevenue, newOrders, avgOrderValue };
  }, [orders]);

  const productPerformance = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number }>();
    orders.forEach(order => {
        order.items.forEach(cartItem => {
            const existing = productSales.get(cartItem.productId) || { name: cartItem.arabicName, quantity: 0 };
            productSales.set(cartItem.productId, { ...existing, quantity: existing.quantity + cartItem.quantity });
        });
    });

    const sortedProducts = Array.from(productSales.values()).sort((a, b) => b.quantity - a.quantity);
    
    const itemsWithStock = items.map(item => ({ name: item.arabicName, stock: item.stock, id: item.id }));
    const slowestMoving = itemsWithStock
      .filter(item => !productSales.has(item.id))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);

    return {
        bestSelling: sortedProducts.slice(0, 5),
        slowestMoving,
    };
  }, [orders, items]);


  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleExport = () => {
    const dataToExport = orders.map(o => ({
        orderId: o.id,
        date: o.date,
        customerName: o.deliveryInfo.name,
        customerPhone: o.deliveryInfo.phone,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        deliveryMethod: o.deliveryMethod,
        itemCount: o.items.length,
    }));
    exportToCsv(dataToExport, `orders_report_${dateRange.start}_to_${dateRange.end}.csv`);
  };

  const StatCard: React.FC<{ title: string, value: string | number }> = ({ title, value }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">تقارير المبيعات</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="p-2 border rounded-md bg-white dark:bg-slate-700 w-full sm:w-auto"/>
                    <span className="text-slate-500">إلى</span>
                    <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="p-2 border rounded-md bg-white dark:bg-slate-700 w-full sm:w-auto"/>
                </div>
                <button onClick={handleExport} className="w-full sm:w-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover">تصدير CSV</button>
            </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-admin-primary" /></div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="إجمالي الإيرادات" value={`${salesData.totalRevenue.toLocaleString()} ج.س`} />
                <StatCard title="الطلبات المسلمة" value={salesData.newOrders.toLocaleString()} />
                <StatCard title="متوسط قيمة الطلب" value={`${salesData.avgOrderValue.toFixed(2)} ج.س`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">أفضل 5 منتجات مبيعاً</h3>
                    <div className="space-y-2">
                        {productPerformance.bestSelling.map(item => (
                            <div key={item.name} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
                                <span className="text-slate-500 dark:text-slate-400">{item.quantity} مبيعات</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">أبطأ 5 منتجات حركة</h3>
                     <div className="space-y-2">
                        {productPerformance.slowestMoving.map(item => (
                            <div key={item.name} className="flex justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
                                <span className="text-slate-500 dark:text-slate-400">المخزون: {item.stock}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsScreen;