import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { Supplier, User } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../hooks/useAuth';
import { logAdminAction } from '../utils/auditLogger';
import SupplierFormModal from '../components/SupplierFormModal';
import AdminEmptyState from '../components/AdminEmptyState';
import { BuildingStorefrontIcon } from '../assets/adminIcons';

const AdminSuppliersScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();
    
    const [users, setUsers] = useState<User[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

    const initialSort = useMemo(() => ({ key: 'name' as const, direction: 'ascending' as const }), []);
    const { documents: suppliers, loading, nextPage, prevPage, hasNextPage, hasPrevPage } = usePaginatedFirestore<Supplier>('suppliers', initialSort);

    useEffect(() => {
        const unsubUsers = db.collection('users').onSnapshot(snap => setUsers(snap.docs.map(d => ({...d.data(), uid: d.id}) as User)));
        const unsubAllSuppliers = db.collection('suppliers').onSnapshot(snap => setAllSuppliers(snap.docs.map(d => ({id: d.id, ...d.data()}) as Supplier)));
        return () => { unsubUsers(); unsubAllSuppliers(); }
    }, []);

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        return suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [suppliers, searchTerm]);

    const handleOpenModal = (supplier: Supplier | null = null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleSave = async (supplierData: Supplier) => {
        if (!adminUser || adminUser.role !== 'super-admin') {
            showToast("You don't have permission to perform this action.", "error");
            return;
        }

        setIsSaving(true);
        const { id, ...data } = supplierData;
        const previousUserId = editingSupplier?.userId;
        const newUserId = data.userId;

        try {
            const batch = db.batch();
            let supplierRef;

            if (editingSupplier) {
                supplierRef = db.collection('suppliers').doc(id);
                batch.update(supplierRef, data);
            } else {
                supplierRef = db.collection('suppliers').doc();
                batch.set(supplierRef, data);
            }

            // Handle user role changes
            if (newUserId && newUserId !== previousUserId) {
                const userRef = db.collection('users').doc(newUserId);
                batch.update(userRef, { role: 'supplier', supplierId: supplierRef.id });
            }
            if (previousUserId && previousUserId !== newUserId) {
                const oldUserRef = db.collection('users').doc(previousUserId);
                batch.update(oldUserRef, { role: 'customer', supplierId: firebase.firestore.FieldValue.delete() });
            }
            
            await batch.commit();
            
            showToast(editingSupplier ? 'Supplier updated!' : 'Supplier added!', 'success');
            logAdminAction(adminUser, editingSupplier ? 'Updated Supplier' : 'Created Supplier', `Name: ${supplierData.name}`);
            setIsModalOpen(false);
            setEditingSupplier(null);

        } catch (error) {
            console.error("Error saving supplier:", error);
            showToast('Failed to save supplier.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const confirmDelete = async () => {
        if (!supplierToDelete) return;
        try {
            await db.collection('suppliers').doc(supplierToDelete.id).delete();
            logAdminAction(adminUser, 'Deleted Supplier', `Name: ${supplierToDelete.name}`);
            showToast('Supplier deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete supplier.', 'error');
        } finally {
            setSupplierToDelete(null);
        }
    };

    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="إدارة الموردين"
          buttonText="إضافة مورد"
          onButtonClick={() => handleOpenModal()}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="ابحث عن مورد..."
        />

        <div className="flex-grow overflow-y-auto">
          {loading ? <TableSkeleton /> : filteredSuppliers.length > 0 ? (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="p-3">اسم المورد</th>
                            <th className="p-3">جهة الاتصال</th>
                            <th className="p-3">الهاتف</th>
                            <th className="p-3">الحساب المربوط</th>
                            <th className="p-3">الإجراءات</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredSuppliers.map(s => {
                            const linkedUser = s.userId ? users.find(u => u.uid === s.userId) : null;
                            return (
                            <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-3 font-medium">{s.name}</td>
                            <td className="p-3">{s.contactPerson}</td>
                            <td className="p-3" dir="ltr">{s.phone}</td>
                            <td className="p-3 text-sm">{linkedUser ? `${linkedUser.name}` : 'غير مربوط'}</td>
                            <td className="p-3 space-x-4 space-x-reverse">
                                <button onClick={() => handleOpenModal(s)} className="text-admin-primary hover:underline">تعديل</button>
                                <button onClick={() => setSupplierToDelete(s)} className="text-red-500 hover:underline">حذف</button>
                            </td>
                            </tr>
                        )})}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                    {filteredSuppliers.map(s => {
                        const linkedUser = s.userId ? users.find(u => u.uid === s.userId) : null;
                        return (
                        <div key={s.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{s.contactPerson}</p>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold" dir="ltr">{s.phone}</p>
                            </div>
                             <div className="mt-2 text-sm text-slate-500">
                                الحساب: <span className="font-semibold">{linkedUser ? linkedUser.name : 'غير مربوط'}</span>
                             </div>
                            <div className="flex justify-end gap-4 mt-4 pt-2 border-t dark:border-slate-600">
                                <button onClick={() => handleOpenModal(s)} className="text-admin-primary font-semibold">تعديل</button>
                                <button onClick={() => setSupplierToDelete(s)} className="text-red-500 font-semibold">حذف</button>
                            </div>
                        </div>
                    )})}
                </div>
            </>
          ) : (
            <AdminEmptyState
                icon={BuildingStorefrontIcon}
                title="لا يوجد موردون"
                message="ابدأ بإضافة الموردين الذين تتعامل معهم."
                buttonText="إضافة المورد الأول"
                onButtonClick={() => handleOpenModal()}
            />
          )}
        </div>
        <Pagination onNext={nextPage} onPrev={prevPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />

        {isModalOpen && <SupplierFormModal supplier={editingSupplier} onClose={() => setIsModalOpen(false)} onSave={handleSave} isSaving={isSaving} users={users} allSuppliers={allSuppliers}/>}
        <ConfirmationModal 
            isOpen={!!supplierToDelete} 
            onClose={() => setSupplierToDelete(null)} 
            onConfirm={confirmDelete} 
            title="تأكيد الحذف" 
            message={`هل أنت متأكد من حذف المورد "${supplierToDelete?.name}"؟`} 
            isDestructive 
        />
      </div>
    );
};
export default AdminSuppliersScreen;