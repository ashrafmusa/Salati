
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Item, Category } from '../types';
import AdminScreenHeader from '../components/AdminScreenHeader';
import { getOptimizedImageUrl, uploadToCloudinary, exportToCsv } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../contexts/ToastContext';
import { SpinnerIcon, PackageIcon, PlusIcon } from '../assets/adminIcons';
import SortableHeader from '../components/SortableHeader';
import { usePaginatedFirestore } from '../hooks/usePaginatedFirestore';
import Pagination from '../components/Pagination';
import TableSkeleton from '../components/TableSkeleton';
import { logAdminAction } from '../utils/auditLogger';
import { useAuth } from '../hooks/useAuth';

const ItemFormModal: React.FC<{
    item?: Item | null;
    onClose: () => void;
    onSave: (item: Item) => void;
    isSaving: boolean;
    categories: Category[];
}> = ({ item, onClose, onSave, isSaving, categories }) => {
    const [formData, setFormData] = useState<Partial<Item>>({});
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (item) {
            setFormData(item);
        } else {
            setFormData({
                id: `item_${Date.now()}`,
                type: 'item',
                name: '',
                arabicName: '',
                category: '',
                description: '',
                price: 0,
                stock: 0,
                imageUrl: '',
                isFeatured: false,
            });
        }
    }, [item]);

    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: (name === 'price' || name === 'stock') ? Number(value) : value }));
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error: any) {
            showToast(`Image upload failed: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.arabicName && formData.category && formData.imageUrl) {
            onSave(formData as Item);
        } else {
            showToast("Please fill all required fields.", 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{item ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="arabicName" value={formData.arabicName || ''} onChange={handleChange} placeholder="الاسم (عربي)" className={inputClasses} required />
                        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Name (English)" className={inputClasses} required />
                        <input name="price" type="number" value={formData.price || ''} onChange={handleChange} placeholder="السعر" className={inputClasses} required />
                        <input name="stock" type="number" value={formData.stock || ''} onChange={handleChange} placeholder="المخزون" className={inputClasses} required />
                    </div>
                    <select name="category" value={formData.category || ''} onChange={handleChange} className={inputClasses} required>
                        <option value="">اختر الفئة</option>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                    </select>
                    <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="الوصف" rows={3} className={inputClasses}></textarea>
                    {/* Image Upload */}
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">صورة الصنف</label>
                         <div className="mt-2 flex items-center gap-4">
                            <img src={getOptimizedImageUrl(formData.imageUrl || '', 200)} alt="Preview" className="w-24 h-24 rounded-md object-cover shadow-sm bg-slate-100" />
                            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center w-32 h-10">
                                {isUploading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'تحميل صورة'}
                            </label>
                            <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={isUploading}/>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <input type="checkbox" id="isFeatured" name="isFeatured" checked={formData.isFeatured || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-admin-primary focus:ring-admin-primary"/>
                        <label htmlFor="isFeatured" className="text-sm font-medium text-slate-700 dark:text-slate-300">عرض في الصفحة الرئيسية</label>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 rounded-md">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md" disabled={isSaving || isUploading}>
                            {isSaving ? 'جارِ الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminItemsScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const unsubCategories = onSnapshot(collection(db, 'categories'), snapshot => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
        });
        return () => unsubCategories();
    }, []);

    const initialSort = useMemo(() => ({ key: 'arabicName' as const, direction: 'ascending' as const }), []);

    const {
        documents: paginatedItems,
        loading,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,
        requestSort,
        sortConfig
    } = usePaginatedFirestore<Item>('items', initialSort);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return paginatedItems;
        return paginatedItems.filter(item =>
            item.arabicName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [paginatedItems, searchTerm]);

    const handleSaveItem = async (itemToSave: Item) => {
        setIsSaving(true);
        const { id, ...itemData } = itemToSave;
        const actionType = editingItem ? 'Updated Item' : 'Created Item';
        try {
            if (editingItem) {
                await updateDoc(doc(db, 'items', id), itemData);
                showToast('Item updated!', 'success');
            } else {
                await setDoc(doc(db, 'items', id), itemData);
                showToast('Item added!', 'success');
            }
            logAdminAction(adminUser, actionType, `Name: ${itemData.arabicName}`);
        } catch (error) {
            showToast('Failed to save item.', 'error');
        }
        setIsSaving(false);
        setIsModalOpen(false);
    };

    const handleToggleFeatured = async (item: Item) => {
        try {
            const newStatus = !item.isFeatured;
            await updateDoc(doc(db, 'items', item.id), { isFeatured: newStatus });
            logAdminAction(adminUser, 'Toggled Featured Item', `Item: ${item.arabicName}, Status: ${newStatus ? 'Featured' : 'Not Featured'}`);
            showToast(`Item is now ${newStatus ? 'featured' : 'not featured'}.`, 'success');
        } catch (error) {
             showToast('Failed to update item.', 'error');
        }
    };
    
    const handleExport = () => {
        exportToCsv(paginatedItems, `items_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteDoc(doc(db, 'items', itemToDelete.id));
            logAdminAction(adminUser, 'Deleted Item', `Name: ${itemToDelete.arabicName}`);
            showToast('Item deleted.', 'success');
        } catch (error) {
            showToast('Failed to delete item.', 'error');
        } finally {
            setItemToDelete(null);
        }
    };

    return (
        <>
            <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 self-start sm:self-center">إدارة الأصناف</h2>
                    <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row items-center gap-2">
                         <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="ابحث عن صنف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-slate-700"
                            />
                        </div>
                         <button onClick={handleExport} className="w-full sm:w-auto bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">تصدير CSV</button>
                         <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover">
                            <PlusIcon className="w-5 h-5 ml-2" />
                            إضافة صنف
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    {loading ? <TableSkeleton /> : filteredItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                            <thead>
                                    <tr className="border-b-2 border-slate-100 dark:border-slate-700">
                                        <SortableHeader<Item> label="الصنف" sortKey="arabicName" requestSort={requestSort} sortConfig={sortConfig} />
                                        <th className="p-3 text-sm font-semibold text-slate-500">عرض بالرئيسية</th>
                                        <SortableHeader<Item> label="السعر" sortKey="price" requestSort={requestSort} sortConfig={sortConfig} />
                                        <SortableHeader<Item> label="المخزون" sortKey="stock" requestSort={requestSort} sortConfig={sortConfig} />
                                        <th className="p-3 text-sm font-semibold text-slate-500">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-sky-100/50">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={getOptimizedImageUrl(item.imageUrl, 100)} alt={item.arabicName} className="w-12 h-12 rounded-md object-cover"/>
                                                    <span className="font-medium">{item.arabicName}</span>
                                                </div>
                                            </td>
                                             <td className="p-3">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" checked={item.isFeatured} onChange={() => handleToggleFeatured(item)} className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-admin-primary"></div>
                                                </label>
                                            </td>
                                            <td className="p-3">{item.price} ج.س</td>
                                            <td className="p-3">{item.stock}</td>
                                            <td className="p-3 space-x-4 space-x-reverse">
                                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-admin-primary hover:underline">تعديل</button>
                                                <button onClick={() => setItemToDelete(item)} className="text-red-500 hover:underline">حذف</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <PackageIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
                            <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
                                {searchTerm ? 'لا توجد أصناف مطابقة' : 'لا توجد أصناف بعد'}
                            </h3>
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
            {isModalOpen && <ItemFormModal item={editingItem} onClose={() => setIsModalOpen(false)} onSave={handleSaveItem} isSaving={isSaving} categories={categories} />}
            <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={confirmDelete} title="Confirm Deletion" message={`Delete item "${itemToDelete?.arabicName}"?`} isDestructive />
        </>
    );
};
export default AdminItemsScreen;
