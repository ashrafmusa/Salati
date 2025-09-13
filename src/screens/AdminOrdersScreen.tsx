import React, { useState, useMemo, useEffect } from 'react';
// FIX: Replaced react-router-dom namespace import with a named import (useSearchParams) and removed the namespace prefix to resolve build errors.
import { useSearchParams } from "react-router-dom";
import { AdminOrder, OrderStatus, Driver } from '../types';
import OrderDetailsModal from '../components/OrderDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { useToast } from '../contexts/ToastContext';
import SortableHeader from '../components/SortableHeader';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../hooks/useAuth';
import { addOrderLog } from '../utils/orderLogger';

const getStatusPillClasses = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Delivered: return { dot: 'bg-green-500', select: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500/50 dark:border-green-500/70'};
        case OrderStatus.Preparing: return { dot: 'bg-yellow-500', select: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-500/50 dark:border-yellow-500/70' };
        case OrderStatus.ReadyForPickup: return { dot: 'bg-purple-500', select: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-500/50 dark:border-purple-500/70' };
        case OrderStatus.OutForDelivery: return { dot: 'bg-blue-500', select: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-500/50 dark:border-blue-500/70' };
        case OrderStatus.Cancelled: return { dot: 'bg-red-500', select: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-500/50 dark:border-red-500/70' };
        default: return { dot: 'bg-slate-400', select: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600' };
    }
}

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
}

const AdminOrdersScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const { showToast } = useToast();
    
    const [searchParams] = useSearchParams();
    const statusFilterFromUrl = searchParams.get('status') as OrderStatus | null;
    const viewOrderFromUrl = searchParams.get('view');

    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(statusFilterFromUrl || 'all');
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = db.collection('drivers').onSnapshot((snapshot) => {
            setDrivers(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Driver)));
        });
        return () => unsubscribe();
    }, []);

    const filters = useMemo(() => {
        const q: [string, firebase.firestore.WhereFilterOp, any][] = [];
        if (statusFilter && statusFilter !== 'all') q.push(['status', '==', statusFilter]);
        return q;
    }, [statusFilter]);

    const initialSort = useMemo(() => ({ key: 'date' as const, direction: 'descending' as const }), []);

    const { documents: paginatedOrders, loading, nextPage, prevPage, hasNextPage, hasPrevPage, requestSort, sortConfig } = usePaginatedFirestore<AdminOrder>('orders', initialSort, filters);

    useEffect(() => {
        if (viewOrderFromUrl && paginatedOrders.length > 0) {
            const orderToView = paginatedOrders.find(o => o.id === viewOrderFromUrl);
            if(orderToView) setSelectedOrder(orderToView);
        }
    }, [viewOrderFromUrl, paginatedOrders]);

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return paginatedOrders;
        const lowercasedTerm = searchTerm.toLowerCase();
        return paginatedOrders.filter(order =>
            (order.deliveryInfo?.name || '').toLowerCase().includes(lowercasedTerm) ||
            order.id.toLowerCase().includes(lowercasedTerm)
        );
    }, [paginatedOrders, searchTerm]);

    const updateOrderWithLog = async (orderId: string, updateData: Partial<Omit<AdminOrder, 'id'>>, logMessage: string) => {
        if (!adminUser) return;
        try {
            const fullUpdateData = { ...updateData, lastUpdatedBy: { id: adminUser.uid, name: adminUser.name }, lastUpdatedAt: new Date().toISOString() };
            await db.collection('orders').doc(orderId).update(fullUpdateData);
            await addOrderLog(orderId, adminUser, logMessage, 'system_log', 'internal');
            showToast('Order updated!', 'success');
        } catch (error) {
            showToast('Failed to update order.', 'error');
        }
    };
    
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        if (!adminUser) return;

        if (newStatus === OrderStatus.Delivered) {
            const order = filteredOrders.find(o => o.id === orderId);
            if (!order) {
                showToast("Could not find order details to update stock.", 'error');
                return;
            }

            try {
                await db.runTransaction(async (transaction) => {
                    const orderRef = db.collection('orders').doc(orderId);
                    const orderDoc = await transaction.get(orderRef);
                    
                    if (orderDoc.data()?.status === OrderStatus.Delivered) {
                        return; // Already processed
                    }

                    for (const item of order.items) {
                        const productCollection = item.productType === 'item' ? 'items' : 'bundles';
                        const productRef = db.collection(productCollection).doc(item.productId);
                        const productDoc = await transaction.get(productRef);
                        if (productDoc.exists) {
                            const currentStock = productDoc.data()?.stock ?? 0;
                            transaction.update(productRef, { stock: currentStock - item.quantity });
                        }
                    }
                    
                    transaction.update(orderRef, { status: newStatus, paymentStatus: 'paid' });
                });

                await addOrderLog(orderId, adminUser, `Status changed to: ${newStatus} and stock updated.`, 'system_log', 'internal');
                showToast('Order delivered and stock levels updated!', 'success');

            } catch (error) {
                console.error("Error during stock deduction transaction: ", error);
                showToast("Failed to update stock. Order status not changed.", 'error');
            }
        } else {
            updateOrderWithLog(orderId, { status: newStatus }, `Status changed to: ${newStatus}`);
        }
    };


    const handleDriverAssign = (orderId: string, driverId: string | null) => {
        const driverName = drivers.find(d => d.id === driverId)?.name || 'Unassigned';
        updateOrderWithLog(orderId, { driverId }, `تم تعيين السائق: ${driverName}`);
    };

    const handleBulkStatusChange = async (newStatus: OrderStatus) => {
        if (selectedOrderIds.size === 0 || !adminUser) return;
        const batch = db.batch();
        selectedOrderIds.forEach(orderId => {
            const orderRef = db.collection('orders').doc(orderId);
            batch.update(orderRef, { status: newStatus, lastUpdatedBy: { id: adminUser.uid, name: adminUser.name }, lastUpdatedAt: new Date().toISOString() });
        });
        try {
            await batch.commit();
            showToast(`Updated ${selectedOrderIds.size} orders to "${newStatus}".`, 'success');
            setSelectedOrderIds(new Set());
        } catch (error) {
            showToast("Failed to update orders.", 'error');
        }
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
        } else {
            setSelectedOrderIds(new Set());
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <AdminScreenHeader title="إدارة الطلبات" searchTerm={searchTerm} onSearchChange={setSearchTerm} searchPlaceholder="ابحث بالاسم أو رقم الطلب..." />
            {/* Filter and bulk action controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600">
                    <option value="all">كل الحالات</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                 <select onChange={e => handleBulkStatusChange(e.target.value as OrderStatus)} disabled={selectedOrderIds.size === 0} className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50">
                    <option>تغيير حالة المحدد</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="flex-grow overflow-y-auto">
                {loading ? <TableSkeleton /> : (
                <>
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="w-full text-right">
                            <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="p-3"><input type="checkbox" onChange={handleSelectAll} checked={selectedOrderIds.size > 0 && selectedOrderIds.size === filteredOrders.length} /></th>
                                    <SortableHeader<AdminOrder> label="رقم الطلب" sortKey="id" requestSort={requestSort} sortConfig={sortConfig} />
                                    <th className="p-3">العميل</th>
                                    <th className="p-3">آخر تحديث بواسطة</th>
                                    <th className="p-3">الحالة</th>
                                    <th className="p-3">السائق</th>
                                    <th className="p-3">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => {
                                    const { select } = getStatusPillClasses(order.status);
                                    return (
                                        <tr key={order.id} className={`border-b dark:border-slate-700 ${selectedOrderIds.has(order.id) ? 'bg-sky-100/50 dark:bg-sky-900/30' : ''}`}>
                                            <td className="p-3"><input type="checkbox" checked={selectedOrderIds.has(order.id)} onChange={e => { const s = new Set(selectedOrderIds); e.target.checked ? s.add(order.id) : s.delete(order.id); setSelectedOrderIds(s); }} /></td>
                                            <td className="p-3 font-mono">{order.id.slice(0, 7).toUpperCase()}</td>
                                            <td className="p-3">{order.deliveryInfo?.name}</td>
                                            <td className="p-3 text-sm text-slate-500">{order.lastUpdatedBy?.name || 'N/A'}</td>
                                            <td className="p-3">
                                                <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)} className={`p-1.5 w-40 text-sm font-semibold rounded-lg border-2 ${select}`}>
                                                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <select value={order.driverId || ''} onChange={e => handleDriverAssign(order.id, e.target.value || null)} className="p-1.5 w-36 rounded text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                                    <option value="">لم يتم التعيين</option>
                                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-3"><button onClick={() => setSelectedOrder(order)} className="text-admin-primary hover:underline">التفاصيل</button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="space-y-4 md:hidden">
                        {filteredOrders.map(order => {
                            const { select } = getStatusPillClasses(order.status);
                            return (
                            <div key={order.id} className={`bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700 ${selectedOrderIds.has(order.id) ? 'ring-2 ring-admin-primary' : ''}`}>
                                <div className="flex justify-between items-start" onClick={() => { const s = new Set(selectedOrderIds); s.has(order.id) ? s.delete(order.id) : s.add(order.id); setSelectedOrderIds(s); }}>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-100">{order.deliveryInfo?.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">#{order.id.slice(0, 7).toUpperCase()}</p>
                                    </div>
                                    <p className="font-bold text-lg text-primary">{order.total.toLocaleString()} ج.س</p>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">الحالة</label>
                                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)} className={`w-full p-2 text-sm font-semibold rounded-lg border-2 ${select}`}>
                                            {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">السائق</label>
                                        <select value={order.driverId || ''} onChange={e => handleDriverAssign(order.id, e.target.value || null)} className="w-full p-2 rounded text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                            <option value="">لم يتم التعيين</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 pt-2 border-t dark:border-slate-600 flex justify-end">
                                    <button onClick={() => setSelectedOrder(order)} className="text-admin-primary font-semibold">عرض التفاصيل</button>
                                </div>
                            </div>
                        )})}
                    </div>
                </>
                )}
            </div>
            <Pagination onNext={nextPage} onPrev={prevPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} drivers={drivers} />}
            <ConfirmationModal {...confirmationState} onClose={() => setConfirmationState(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
};

export default AdminOrdersScreen;