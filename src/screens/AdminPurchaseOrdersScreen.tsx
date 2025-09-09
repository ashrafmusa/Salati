import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrder, PurchaseOrderStatus } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';

const getStatusPillClasses = (status: PurchaseOrderStatus) => {
    switch (status) {
        case PurchaseOrderStatus.FullyReceived: return 'bg-green-100 text-green-800';
        case PurchaseOrderStatus.PartiallyReceived: return 'bg-sky-100 text-sky-800';
        case PurchaseOrderStatus.Sent: return 'bg-blue-100 text-blue-800';
        case PurchaseOrderStatus.Draft: return 'bg-slate-100 text-slate-800';
        case PurchaseOrderStatus.Cancelled: return 'bg-red-100 text-red-800';
        default: return 'bg-slate-100 text-slate-800';
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
          {loading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
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
          )}
        </div>
        <Pagination onNext={nextPage} onPrev={prevPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />
      </div>
    );
};

export default AdminPurchaseOrdersScreen;