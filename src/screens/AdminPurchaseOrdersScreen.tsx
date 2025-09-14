import React, { useState, useMemo } from 'react';
// FIX: Split react-router-dom imports to resolve module export errors.
// FIX: Changed react-router import to react-router-dom to resolve module export errors.
import { useNavigate } from 'react-router-dom';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';
import AdminEmptyState from '../components/AdminEmptyState';
import { ClipboardDocumentListIcon } from '../assets/adminIcons';

const getStatusPillClasses = (status: PurchaseOrderStatus) => {
    switch (status) {
        case PurchaseOrderStatus.FullyReceived: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case PurchaseOrderStatus.PartiallyReceived: return 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300';
        case PurchaseOrderStatus.Sent: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case PurchaseOrderStatus.Draft: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        case PurchaseOrderStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const AdminPurchaseOrdersScreen: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const initialSort = useMemo(() => ({ key: 'createdDate' as const, direction: 'descending' as const }), []);
    const { documents: purchaseOrders, loading, nextPage, prevPage, hasNextPage, hasPrevPage } = usePaginatedFirestore<PurchaseOrder>('purchaseOrders', initialSort);

    const filteredPOs = useMemo(() => {
        if (!searchTerm) return purchaseOrders;
        return purchaseOrders.filter(po => po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [purchaseOrders, searchTerm]);

    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="أوامر الشراء"
          buttonText="إنشاء أمر شراء"
          onButtonClick={() => navigate('/purchase-orders/new')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="ابحث باسم المورد..."
        />

        <div className="flex-grow overflow-y-auto">
          {loading ? <TableSkeleton /> : filteredPOs.length > 0 ? (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="p-3">رقم الأمر</th>
                            <th className="p-3">المورد</th>
                            <th className="p-3">تاريخ الإنشاء</th>
                            <th className="p-3">التكلفة الإجمالية</th>
                            <th className="p-3">الحالة</th>
                            <th className="p-3"></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredPOs.map(po => (
                            <tr key={po.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-3 font-mono text-sm">#{po.id.slice(0, 7).toUpperCase()}</td>
                            <td className="p-3 font-medium">{po.supplierName}</td>
                            <td className="p-3">{new Date(po.createdDate).toLocaleDateString('ar-EG')}</td>
                            <td className="p-3">{po.totalCost.toLocaleString()} ج.س</td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPillClasses(po.status)}`}>
                                    {po.status}
                                </span>
                            </td>
                            <td className="p-3">
                                <button onClick={() => navigate(`/purchase-orders/${po.id}`)} className="text-admin-primary hover:underline">عرض/تعديل</button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {filteredPOs.map(po => (
                        <div key={po.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{po.supplierName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">#{po.id.slice(0, 7).toUpperCase()}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusPillClasses(po.status)}`}>
                                    {po.status}
                                </span>
                            </div>
                             <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                تاريخ الإنشاء: {new Date(po.createdDate).toLocaleDateString('ar-EG')}
                            </div>
                            <div className="mt-4 pt-4 border-t dark:border-slate-600 flex justify-between items-center">
                                <div>
                                    <span className="text-sm text-slate-500">التكلفة الإجمالية</span>
                                    <p className="font-bold text-lg text-primary">{po.totalCost.toLocaleString()} ج.س</p>
                                </div>
                                <button onClick={() => navigate(`/purchase-orders/${po.id}`)} className="text-admin-primary bg-admin-primary/10 font-semibold px-4 py-2 text-sm rounded-md">
                                    عرض التفاصيل
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
          ) : (
            <AdminEmptyState
                icon={ClipboardDocumentListIcon}
                title="لا توجد أوامر شراء"
                message="ابدأ بإنشاء أمر شراء جديد لتزويد مخزونك."
                buttonText="إنشاء أمر شراء"
                onButtonClick={() => navigate('/purchase-orders/new')}
            />
          )}
        </div>
        <Pagination onNext={nextPage} onPrev={prevPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />
      </div>
    );
};

export default AdminPurchaseOrdersScreen;