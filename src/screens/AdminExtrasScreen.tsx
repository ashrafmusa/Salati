
import React, { useState, useMemo } from 'react';
import { db } from '../firebase/config';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import { ExtraItem } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { getOptimizedImageUrl } from '../utils/helpers';
import ExtraFormModal from '../components/ExtraFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { BeakerIcon, PlusIcon } from '../assets/adminIcons';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../hooks/useAuth';
import { logAdminAction } from '../utils/auditLogger';

const AdminExtrasScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExtra, setEditingExtra] = useState<ExtraItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [extraToDelete, setExtraToDelete] = useState<ExtraItem | null>(null);
    const { showToast } = useToast();

    const initialSort = useMemo(() => ({ key: 'name' as const, direction: 'ascending' as const }), []);

    const {
        documents: paginatedExtras,
        loading,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,
        requestSort,
        sortConfig
    } = usePaginatedFirestore<ExtraItem>('extras', initialSort);

    const filteredExtras = useMemo(() => {
        if (!searchTerm) return paginatedExtras;
        return paginatedExtras.filter(extra =>
            extra.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [paginatedExtras, searchTerm]);

    const handleOpenModal = (extra: ExtraItem | null = null) => {
        setEditingExtra(extra);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExtra(null);
    };

    const handleSaveExtra = async (extraToSave: ExtraItem) => {
        setIsSaving(true);
        const { id, ...extraData } = extraToSave;
        try {
            if (editingExtra) {
                // FIX: Refactored Firestore updateDoc and doc calls to use v8 compat syntax.
                await db.collection('extras').doc(id).update(extraData);
                showToast('Extra item updated successfully!', 'success');
            } else {
                // FIX: Refactored Firestore setDoc and doc calls to use v8 compat syntax.
                await db.collection('extras').doc(id).set(extraData);
                showToast('Extra item added successfully!', 'success');
            }
            await logAdminAction(adminUser, editingExtra ? 'Updated Extra' : 'Created Extra', `Name: ${extraToSave.name}`);
        } catch (error) {
            console.error("Error saving extra:", error);
            showToast('Failed to save extra item.', 'error');
        } finally {
            setIsSaving(false);
            handleCloseModal();
        }
    };
    
    const confirmDelete = async () => {
        if (!extraToDelete) return;
        try {
            // FIX: Refactored Firestore deleteDoc and doc calls to use v8 compat syntax.
            await db.collection('extras').doc(extraToDelete.id).delete();
            await logAdminAction(adminUser, 'Deleted Extra', `Name: ${extraToDelete.name}`);
            showToast('Extra item deleted successfully.', 'success');
        } catch (error) {
            console.error("Error deleting extra:", error);
            showToast('Failed to delete extra item.', 'error');
        } finally {
            setExtraToDelete(null);
        }
    };

    return (
        <>
            <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
                <AdminScreenHeader
                    title="إدارة الإضافات"
                    buttonText="إضافة عنصر"
                    onButtonClick={() => handleOpenModal()}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="ابحث باسم العنصر..."
                />
                
                <div className="flex-grow overflow-y-auto">
                    {loading ? <TableSkeleton /> : filteredExtras.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="overflow-x-auto hidden md:block">
                                <table className="w-full text-right">
                                    <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                                        <tr>
                                            <SortableHeader<ExtraItem> label="العنصر" sortKey="name" requestSort={requestSort} sortConfig={sortConfig} />
                                            <SortableHeader<ExtraItem> label="السعر" sortKey="price" requestSort={requestSort} sortConfig={sortConfig} />
                                            <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExtras.map((extra, index) => (
                                            <tr key={extra.id} className={`border-b dark:border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={getOptimizedImageUrl(extra.imageUrl, 100)} alt={extra.name} className="w-14 h-14 rounded-md object-cover"/>
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">{extra.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-slate-600 dark:text-slate-300">{extra.price} ج.س</td>
                                                <td className="p-3 space-x-4 space-x-reverse">
                                                    <button onClick={() => handleOpenModal(extra)} className="text-admin-primary hover:underline text-sm font-semibold">تعديل</button>
                                                    <button onClick={() => setExtraToDelete(extra)} className="text-red-500 hover:underline text-sm font-semibold">حذف</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobile Card View */}
                            <div className="space-y-4 md:hidden">
                                {filteredExtras.map(extra => (
                                    <div key={extra.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700">
                                        <div className="flex items-start gap-4">
                                            <img src={getOptimizedImageUrl(extra.imageUrl, 150)} alt={extra.name} className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{extra.name}</p>
                                                <p className="font-semibold text-primary dark:text-green-400">{extra.price} ج.س</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-4 mt-4 pt-4 border-t dark:border-slate-700">
                                            <button onClick={() => handleOpenModal(extra)} className="text-admin-primary font-semibold">تعديل</button>
                                            <button onClick={() => setExtraToDelete(extra)} className="text-red-500 font-semibold">حذف</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <BeakerIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
                            <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
                            {searchTerm ? 'لا توجد إضافات مطابقة' : 'لا توجد إضافات بعد'}
                            </h3>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                {searchTerm ? 'حاول البحث بكلمة أخرى.' : 'ابدأ بإضافة العناصر الإضافية لمنتجاتك.'}
                            </p>
                            {!searchTerm && (
                                <button 
                                    onClick={() => handleOpenModal()}
                                    className="mt-6 flex items-center mx-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm">
                                    <PlusIcon className="w-5 h-5 ml-2" />
                                    إضافة عنصر
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <Pagination
                    onNext={nextPage}
                    onPrev={prevPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                />
            </div>

            {isModalOpen && (
                <ExtraFormModal
                    extra={editingExtra}
                    onClose={handleCloseModal}
                    onSave={handleSaveExtra}
                    isSaving={isSaving}
                />
            )}

            <ConfirmationModal
                isOpen={!!extraToDelete}
                onClose={() => setExtraToDelete(null)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message={`هل أنت متأكد من رغبتك في حذف العنصر "${extraToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmText="نعم، احذف"
                cancelText="إلغاء"
                isDestructive={true}
            />
        </>
    );
};
export default AdminExtrasScreen;
