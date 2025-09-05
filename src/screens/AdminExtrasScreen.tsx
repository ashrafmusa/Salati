import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ExtraItem } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { getOptimizedImageUrl } from '../utils/helpers';
import ExtraFormModal from '../components/ExtraFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { BeakerIcon, PlusIcon } from '../assets/adminIcons';

const AdminExtrasScreen: React.FC = () => {
    const [extras, setExtras] = useState<ExtraItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExtra, setEditingExtra] = useState<ExtraItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [extraToDelete, setExtraToDelete] = useState<ExtraItem | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'extras'), snapshot => {
            const fetchedExtras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtraItem));
            setExtras(fetchedExtras);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredExtras = useMemo(() => {
        return extras.filter(extra =>
            extra.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [extras, searchTerm]);

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
                await updateDoc(doc(db, 'extras', id), extraData);
                showToast('Extra item updated successfully!', 'success');
            } else {
                await setDoc(doc(db, 'extras', id), extraData);
                showToast('Extra item added successfully!', 'success');
            }
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
            await deleteDoc(doc(db, 'extras', extraToDelete.id));
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
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
                <AdminScreenHeader
                    title="إدارة الإضافات"
                    buttonText="إضافة عنصر"
                    onButtonClick={() => handleOpenModal()}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="ابحث باسم العنصر..."
                />
                
                {loading ? <p>Loading extra items...</p> : filteredExtras.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400 w-20"></th>
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الاسم</th>
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">السعر</th>
                                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExtras.map((extra, index) => (
                                    <tr key={extra.id} className={`border-b dark:border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}>
                                        <td className="p-2">
                                            <img src={getOptimizedImageUrl(extra.imageUrl, 100)} alt={extra.name} className="w-14 h-14 rounded-md object-cover"/>
                                        </td>
                                        <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{extra.name}</td>
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

// FIX: Added default export to fix lazy loading issue.
export default AdminExtrasScreen;