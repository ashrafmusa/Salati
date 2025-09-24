import React, { useState, useEffect, useMemo } from 'react';
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from "react-router-dom";
const { useNavigate } = ReactRouterDOM;
import StatCard from '../components/StatCard';
import { OrdersIcon, PackageIcon, CustomersIcon, CurrencyDollarIcon } from '../assets/adminIcons';
import { AdminOrder, OrderStatus, Item, Bundle, StoreSettings } from '../types';
import { db } from '../firebase/config';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import DonutChart from '../components/DonutChart';
import LineChart from '../components/LineChart';
import { useAuth } from '../hooks/useAuth';
import { validateData, DataValidationIssue } from '../utils/dataValidation';
import DataValidationNotice from '../components/DataValidationNotice';

type DateRange = 'today' | '7d' | '30d';

const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered: return { pill: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', color: '#22c55e' };
        case OrderStatus.Preparing: return { pill: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', color: '#f59e0b' };
        case OrderStatus.ReadyForPickup: return { pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', color: '#a855f7' };
        case OrderStatus.OutForDelivery: return { pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', color: '#3b82f6' };
        case OrderStatus.Cancelled: return { pill: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', color: '#ef4444' };
        default: return { pill: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200', color: '#94a3b8' };
    }
}

const RecentOrdersSkeleton: React.FC = () => (
    <>
        {/* Desktop Skeleton */}
        <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-right">
                <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                    <tr>
                        <th className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20"></div></th>
                        <th className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32"></div></th>
                        <th className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div></th>
                        <th className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-28"></div></th>
                        <th className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b dark:border-slate-700">
                            <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20"></div></td>
                            <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32"></div></td>
                            <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div></td>
                            <td className="p-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-28"></div></td>
                            <td className="p-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse w-24"></div></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {/* Mobile Skeleton */}
        <div className="space-y-4 md:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-700 animate-pulse">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-between items-center">
                         <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                         <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </>
);


const RecentOrders: React.FC<{ orders: AdminOrder[], loading: boolean }> = ({ orders, loading }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">أحدث الطلبات</h3>
        {loading ? <RecentOrdersSkeleton /> : (
            <>
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">رقم الطلب</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">العميل</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">التاريخ</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الإجمالي</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{order.id.slice(0, 7).toUpperCase()}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{order.deliveryInfo?.name || 'غير معروف'}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400 text-xs">{order.date ? new Date(order.date).toLocaleDateString('ar-EG') : 'N/A'}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{(order.total || 0).toLocaleString()} ج.س</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusConfig(order.status || OrderStatus.Preparing).pill}`}>
                                            {order.status || OrderStatus.Preparing}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="space-y-4 md:hidden">
                    {orders.map(order => (
                        <div key={order.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{order.deliveryInfo?.name || 'غير معروف'}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">#{order.id.slice(0,7).toUpperCase()}</p>
                                </div>
                                <p className="font-bold text-primary">{(order.total || 0).toLocaleString()} ج.س</p>
                            </div>
                            <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-between items-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusConfig(order.status || OrderStatus.Preparing).pill}`}>
                                    {order.status || OrderStatus.Preparing}
                                </span>
                                <span className="text-xs text-slate-500">{order.date ? new Date(order.date).toLocaleDateString('ar-EG') : 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
);

const AdminDashboardScreen: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [allUsersCount, setAllUsersCount] = useState(0);
    const [allLowStockItems, setAllLowStockItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>('7d');
    const [validationIssues, setValidationIssues] = useState<DataValidationIssue[]>([]);
    const [showValidationNotice, setShowValidationNotice] = useState(true);

    useEffect(() => {
        setLoading(true);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let startDate = new Date(startOfDay);

        if (dateRange === '7d') {
            startDate.setDate(startOfDay.getDate() - 6);
        } else if (dateRange === '30d') {
            startDate.setDate(startOfDay.getDate() - 29);
        }
        
        const ordersQuery = db.collection('orders')
            .where('date', '>=', startDate.toISOString())
            .orderBy('date', 'desc');

        const unsubOrders = ordersQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as AdminOrder));
            setOrders(fetchedOrders);
            setLoading(false);
        });

        return () => unsubOrders();
    }, [dateRange]);

    useEffect(() => {
        const unsubs: (() => void)[] = [];
        
        const usersQuery = db.collection('users').where('role', '==', 'customer');
        unsubs.push(usersQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
            setAllUsersCount(snapshot.size);
        }));

        const itemsQuery = db.collection('items');
        unsubs.push(itemsQuery.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Item));
            setAllLowStockItems(products.filter(p => (p.stock || 0) < 20).length);
        }));
        
        if (user?.role === 'super-admin') {
            const fetchAllDataForValidation = async () => {
                try {
                    const itemsSnapshot = await db.collection('items').get();
                    const bundlesSnapshot = await db.collection('bundles').get();
                    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Item));
                    const bundles = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Bundle));
                    const settingsSnap = await db.collection('settings').get();
                    const settings = settingsSnap.docs.length > 0 ? settingsSnap.docs[0].data() as StoreSettings : null;
                    setValidationIssues(validateData(items, bundles, settings));
                } catch (error) {
                    console.error("Error performing data validation:", error);
                }
            };
            fetchAllDataForValidation();
        }

        return () => unsubs.forEach(unsub => unsub());
    }, [user]);
    
    const stats = useMemo(() => {
        const totalRevenue = orders
            .filter(o => o.status === OrderStatus.Delivered)
            .reduce((sum, order) => sum + (order.total || 0), 0);
        
        const newOrders = orders.filter(o => o.status === OrderStatus.Preparing).length;

        return { totalRevenue, newOrders };
    }, [orders]);

    const revenueData = useMemo(() => {
        const days = dateRange === 'today' ? 1 : dateRange === '7d' ? 7 : 30;
        const dailyRevenue = new Map<string, number>();

        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-CA');
            dailyRevenue.set(key, 0);
        }

        orders.forEach(order => {
            if (!order.date || order.status !== OrderStatus.Delivered) return;
            const key = new Date(order.date).toLocaleDateString('en-CA');
            if (dailyRevenue.has(key)) {
                dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + (order.total || 0));
            }
        });

        return Array.from(dailyRevenue.entries())
            .map(([date, revenue]) => ({ label: new Date(date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }), value: revenue, date: new Date(date) }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(({ label, value }) => ({ label, value }));

    }, [orders, dateRange]);

    const chartData = useMemo(() => {
      const counts = orders.reduce((acc, order) => {
        const status = order.status || OrderStatus.Preparing;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<OrderStatus, number>);
  
      return Object.entries(counts).map(([status, value]) => ({
        label: status,
        value,
        color: getStatusConfig(status as OrderStatus).color,
      }));
    }, [orders]);
    
    const handleChartClick = (status: string) => {
        navigate(`/orders?status=${status}`);
    };

    const DateRangeFilter = () => (
        <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
            {(['today', '7d', '30d'] as DateRange[]).map(range => (
                <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        dateRange === range
                        ? 'bg-white dark:bg-slate-800 text-admin-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100'
                    }`}
                >
                    {range === 'today' ? 'اليوم' : range === '7d' ? 'آخر 7 أيام' : 'آخر 30 يومًا'}
                </button>
            ))}
        </div>
    );

  return (
    <div className="space-y-8">
      {user?.role === 'super-admin' && showValidationNotice && (
          <DataValidationNotice 
              issues={validationIssues}
              onDismiss={() => setShowValidationNotice(false)}
          />
      )}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">نظرة عامة على لوحة التحكم</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">أهلاً بعودتك! إليك آخر المستجدات.</p>
        </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          to="/orders"
          title="إجمالي الإيرادات" 
          value={loading ? '...' : `${stats.totalRevenue.toLocaleString()}`} 
          icon={<CurrencyDollarIcon />}
          textColor="text-green-500"
        />
        <StatCard 
          to={`/orders?status=${OrderStatus.Preparing}`}
          title="الطلبات الجديدة" 
          value={loading ? '...' : stats.newOrders} 
          icon={<OrdersIcon />}
          textColor="text-amber-500"
        />
        <StatCard 
          to="/users"
          title="العملاء" 
          value={loading ? '...' : allUsersCount} 
          icon={<CustomersIcon />}
          textColor="text-blue-500"
        />
        <StatCard 
          to="/products"
          title="منتجات تحتاج إعادة تخزين" 
          value={loading ? '...' : allLowStockItems} 
          icon={<PackageIcon />}
          textColor="text-red-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            الإيرادات لـ {dateRange === 'today' ? 'اليوم' : dateRange === '7d' ? 'آخر 7 أيام' : 'آخر 30 يومًا'}
          </h3>
          <div className="h-72">
              {loading ? <p className="text-center pt-20">Loading chart data...</p> : <LineChart data={revenueData} />}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <RecentOrders orders={orders.slice(0, 5)} loading={loading} />
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">ملخص حالة الطلبات</h3>
            <DonutChart data={chartData} onSegmentClick={handleChartClick} />
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
              {chartData.map(item => (
                <div key={item.label} className="flex items-center">
                  <span className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: item.color }}></span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">{item.label}: {item.value}</span>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;