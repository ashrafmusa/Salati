import React, { useState, useEffect, useMemo } from "react";
import StatCard from "../components/StatCard";
// FIX: `BasketsIcon` does not exist. Replaced with `PackageIcon`.
import {
  OrdersIcon,
  PackageIcon,
  CustomersIcon,
  CurrencyDollarIcon,
} from "../assets/adminIcons";
// FIX: The `Product` type is obsolete. Switched to `Item` for fetching low stock items.
import { AdminOrder, OrderStatus, Item } from "../types";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import DonutChart from "../components/DonutChart";
import LineChart from "../components/LineChart";

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Delivered:
      return {
        pill: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
        color: "#22c55e",
      };
    case OrderStatus.Preparing:
      return {
        pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
        color: "#f59e0b",
      };
    case OrderStatus.ReadyForPickup:
      return {
        pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
        color: "#a855f7",
      };
    case OrderStatus.OutForDelivery:
      return {
        pill: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        color: "#3b82f6",
      };
    case OrderStatus.Cancelled:
      return {
        pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
        color: "#ef4444",
      };
    default:
      return {
        pill: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
        color: "#94a3b8",
      };
  }
};

const RecentOrders: React.FC<{ orders: AdminOrder[]; loading: boolean }> = ({
  orders,
  loading,
}) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
      أحدث الطلبات
    </h3>
    <div className="overflow-x-auto hidden md:block">
      <table className="w-full text-right">
        <thead className="border-b-2 border-slate-100 dark:border-slate-700">
          <tr>
            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              رقم الطلب
            </th>
            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              العميل
            </th>
            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              التاريخ
            </th>
            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              الإجمالي
            </th>
            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
              الحالة
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="text-center p-4">
                Loading...
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                  {order.id.slice(0, 7).toUpperCase()}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {order.deliveryInfo.name}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400 text-xs">
                  {new Date(order.date).toLocaleDateString("ar-EG")}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {order.total.toLocaleString()} ج.س
                </td>
                <td className="p-3">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      getStatusConfig(order.status).pill
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    <div className="space-y-4 md:hidden">
      {loading ? (
        <p>Loading...</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-700"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {order.deliveryInfo.name}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  #{order.id.slice(0, 7).toUpperCase()}
                </p>
              </div>
              <p className="font-bold text-primary">
                {order.total.toLocaleString()} ج.س
              </p>
            </div>
            <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-between items-center">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  getStatusConfig(order.status).pill
                }`}
              >
                {order.status}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(order.date).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const AdminDashboardScreen: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    newOrders: 0,
    customerCount: 0,
    lowStockItems: 0,
  });
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [revenueData, setRevenueData] = useState<
    { label: string; value: number }[]
  >([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Orders listener
    const ordersQuery = query(collection(db, "orders"));
    unsubs.push(
      onSnapshot(ordersQuery, (snapshot) => {
        const orders = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as AdminOrder)
        );
        setAllOrders(orders);

        const totalRevenue = orders
          .filter((o) => o.paymentStatus === "paid")
          .reduce((sum, order) => sum + order.total, 0);
        const newOrders = orders.filter(
          (o) => o.status === OrderStatus.Preparing
        ).length;

        const sortedRecent = [...orders]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5);

        setStats((prev) => ({ ...prev, totalRevenue, newOrders }));
        setRecentOrders(sortedRecent);
        setLoading(false); // Set loading to false after the main data is fetched
      })
    );

    // Users listener
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "customer")
    );
    unsubs.push(
      onSnapshot(usersQuery, (snapshot) => {
        setStats((prev) => ({ ...prev, customerCount: snapshot.size }));
      })
    );

    // Items listener for low stock count
    const itemsQuery = query(collection(db, "items"));
    unsubs.push(
      onSnapshot(itemsQuery, (snapshot) => {
        const products = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Item)
        );
        const lowStockItems = products.filter(
          (p) => (p.stock || 0) < 20
        ).length;
        setStats((prev) => ({ ...prev, lowStockItems }));
      })
    );

    // Revenue listener (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const revenueQuery = query(
      collection(db, "orders"),
      where("date", ">=", sevenDaysAgo.toISOString()),
      where("paymentStatus", "==", "paid")
    );
    unsubs.push(
      onSnapshot(revenueQuery, (snapshot) => {
        const paidOrders = snapshot.docs.map((doc) => doc.data() as AdminOrder);

        const dailyRevenue = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("en-CA");
          dailyRevenue.set(key, 0);
        }

        paidOrders.forEach((order) => {
          const orderDate = new Date(order.date);
          const key = orderDate.toLocaleDateString("en-CA");
          if (dailyRevenue.has(key)) {
            dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + order.total);
          }
        });

        const chartData = Array.from(dailyRevenue.entries())
          .map(([date, revenue]) => {
            const d = new Date(date);
            const label = d.toLocaleDateString("ar-EG", {
              month: "short",
              day: "numeric",
            });
            return { label, value: revenue, date: d };
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(({ label, value }) => ({ label, value }));

        setRevenueData(chartData);
      })
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const chartData = useMemo(() => {
    const counts = allOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    return Object.entries(counts).map(([status, value]) => ({
      label: status,
      value,
      color: getStatusConfig(status as OrderStatus).color,
    }));
  }, [allOrders]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          نظرة عامة على لوحة التحكم
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          أهلاً بعودتك! إليك آخر المستجدات.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          to="/orders"
          title="إجمالي الإيرادات"
          value={loading ? "..." : `${stats.totalRevenue.toLocaleString()}`}
          icon={<CurrencyDollarIcon />}
          colorClass="bg-status-delivered"
        />
        <StatCard
          to={`/orders?status=${OrderStatus.Preparing}`}
          title="الطلبات الجديدة"
          value={loading ? "..." : stats.newOrders}
          icon={<OrdersIcon />}
          colorClass="bg-status-preparing"
        />
        <StatCard
          to="/users"
          title="العملاء"
          value={loading ? "..." : stats.customerCount}
          icon={<CustomersIcon />}
          colorClass="bg-status-delivering"
        />
        <StatCard
          to="/items"
          title="منتجات تحتاج إعادة تخزين"
          value={loading ? "..." : stats.lowStockItems}
          icon={<PackageIcon />}
          colorClass="bg-status-cancelled"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          إيرادات آخر 7 أيام
        </h3>
        <div className="h-72">
          {loading ? (
            <p className="text-center pt-20">Loading chart data...</p>
          ) : (
            <LineChart data={revenueData} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} loading={loading} />
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            ملخص حالة الطلبات
          </h3>
          <DonutChart data={chartData} />
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center">
                <span
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
