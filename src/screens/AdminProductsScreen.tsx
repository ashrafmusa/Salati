
import React, { useState, useEffect, useMemo } from 'react';
import { Bundle, Category, Item, BundleContent } from '../types';
import { db } from '../firebase/config';
import { TrashIcon, SpinnerIcon, PlusIcon } from '../assets/icons';
import { calculateBundlePrice, uploadToCloudinary, getOptimizedImageUrl } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import AdminScreenHeader from '../components/AdminScreenHeader';

const BundleFormModal: React.FC<{ 
    bundle?: Bundle | null, 
    onClose: () => void, 
    onSave: (bundle: Bundle) => void, 
    isSaving: boolean,
    categories: Category[],
    allItems: Item[]
}> = ({ bundle, onClose, onSave, isSaving, categories, allItems }) => {
    const [formData, setFormData] = useState<Partial<Bundle>>({ contents: [] });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        if (bundle) {
            setFormData(JSON.parse(JSON.stringify(bundle)));
            if (bundle.imageUrl) setImagePreview(bundle.imageUrl);
        } else {
            setFormData({ 
                id: `bun_${Date.now()}`,
                type: 'bundle',
                name: '', 
                arabicName: '', 
                category: '', 
                stock: 0, 
                description: '', 
                contents: [], 
                imageUrl: '',
                availableExtras: []
            });
            setImagePreview(null);
        }
    }, [bundle]);
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const downloadURL = await uploadToCloudinary(file);
            setImagePreview(downloadURL);
            setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
        } catch (error: any) {
            showToast(`Image upload failed: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'stock' ? Number(value) : value }));
    };

    const handleContentChange = (index: number, field: keyof BundleContent, value: string | number) => {
        const newContents = [...(formData.contents || [])];
        if (field === 'quantity') {
            newContents[index] = { ...newContents[index], [field]: Number(value) };
        } else {
            newContents[index] = { ...newContents[index], [field]: value as string };
        }
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const addContentItem = (item: Item) => {
        const newContents = [...(formData.contents || [])];
        const existingIndex = newContents.findIndex(c => c.itemId === item.id);
        if (existingIndex > -1) {
            newContents[existingIndex].quantity += 1;
        } else {
            newContents.push({ itemId: item.id, quantity: 1 });
        }
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const removeContentItem = (index: number) => {
        const newContents = [...(formData.contents || [])];
        newContents.splice(index, 1);
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.arabicName && formData.category && formData.contents && formData.contents.length > 0) {
            onSave(formData as Bundle);
        } else {
            showToast('Please fill all required fields and add at least one item.', 'error');
        }
    };

    const filteredItems = useMemo(() => {
        return allItems.filter(item => item.arabicName.toLowerCase().includes(itemSearch.toLowerCase()));
    }, [allItems, itemSearch]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{bundle ? 'تعديل الحزمة' : 'إضافة حزمة جديدة'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="arabicName" placeholder="اسم الحزمة (عربي)" value={formData.arabicName || ''} onChange={handleChange} className={inputClasses} required />
                        <input type="number" name="stock" placeholder="المخزون" value={formData.stock || ''} onChange={handleChange} className={inputClasses} required />
                        <select name="category" value={formData.category || ''} onChange={handleChange} className={inputClasses} required>
                            <option value="">اختر الفئة</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <input type="text" name="name" placeholder="Bundle Name (English)" value={formData.name || ''} onChange={handleChange} className={inputClasses} required />
                    </div>
                    {/* Contents Management */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Item Selector */}
                        <div>
                             <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">اختر الأصناف لإضافتها</h3>
                             <input type="search" placeholder="ابحث عن صنف..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className={`${inputClasses} mb-2`} />
                             <div className="h-60 overflow-y-auto border dark:border-slate-700 rounded-md p-2 space-y-1">
                                {filteredItems.map(item => (
                                    <button type="button" key={item.id} onClick={() => addContentItem(item)} className="w-full text-right p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between items-center">
                                        <span>{item.arabicName}</span>
                                        <span className="text-sm text-slate-500">{item.price} ج.س</span>
                                    </button>
                                ))}
                             </div>
                        </div>
                        {/* Selected Items */}
                        <div>
                             <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">الأصناف في الحزمة</h3>
                             <div className="h-60 overflow-y-auto border dark:border-slate-700 rounded-md p-2 space-y-2">
                                {(formData.contents || []).map((content, index) => {
                                    const item = allItems.find(i => i.id === content.itemId);
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded">
                                            <span className="flex-grow text-sm font-medium">{item?.arabicName}</span>
                                            <input type="number" min="1" value={content.quantity} onChange={e => handleContentChange(index, 'quantity', e.target.value)} className="w-16 p-1 text-center rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                                            <button type="button" onClick={() => removeContentItem(index)} className="text-red-500 p-1"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    )
                                })}
                                {(formData.contents || []).length === 0 && <p className="text-center text-sm text-slate-400 p-4">لم يتم إضافة أصناف</p>}
                             </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-slate-700 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-300 dark:bg-slate-600 rounded-md hover:bg-slate-400">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover flex items-center justify-center w-24" disabled={isSaving}>
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminBundlesScreen: React.FC = () => {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [bundleToDelete, setBundleToDelete] = useState<Bundle | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        const unsubscribers = [
            db.collection('bundles').onSnapshot(snapshot => {
                setBundles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bundle)));
                setLoading(false);
            }),
            db.collection('categories').orderBy('sortOrder').onSnapshot(snapshot => {
                setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
            }),
            db.collection('items').onSnapshot(snapshot => {
                setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item)));
            }),
        ];
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);
    
    const filteredBundles = useMemo(() => {
        return bundles.filter(bundle =>
            bundle.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bundle.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bundles, searchTerm]);

    const handleSaveBundle = async (bundleToSave: Bundle) => {
        setIsSaving(true);
        const { id, ...bundleData } = bundleToSave;
        try {
            if (editingBundle) {
                await db.collection('bundles').doc(id).update(bundleData);
                showToast('Bundle updated successfully!', 'success');
            } else {
                await db.collection('bundles').doc(id).set(bundleData);
                showToast('Bundle added successfully!', 'success');
            }
        } catch (error) {
            showToast('Failed to save bundle.', 'error');
        }
        setIsSaving(false);
        setIsModalOpen(false);
    };

    const confirmDelete = async () => {
        if (!bundleToDelete) return;
        try {
            await db.collection('bundles').doc(bundleToDelete.id).delete();
            showToast('Bundle deleted successfully.', 'success');
        } catch (error) {
            showToast('Failed to delete bundle.', 'error');
        } finally {
            setBundleToDelete(null);
        }
    };

    return (
        <>
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
            <AdminScreenHeader
                title="إدارة الحزم"
                buttonText="إضافة حزمة"
                onButtonClick={() => { setEditingBundle(null); setIsModalOpen(true); }}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="ابحث عن حزمة..."
            />
            
            {loading ? <p>Loading...</p> : (
            <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b-2 border-slate-100 dark:border-slate-700">
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">اسم الحزمة</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الفئة</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">السعر المحسوب</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">المخزون</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBundles.map(bundle => (
                                <tr key={bundle.id} className="border-b dark:border-slate-700 hover:bg-sky-100/50 dark:hover:bg-sky-900/20">
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{bundle.arabicName}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{bundle.category}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{calculateBundlePrice(bundle, items)} ج.س</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{bundle.stock}</td>
                                    <td className="p-3 space-x-4 space-x-reverse">
                                        <button onClick={() => {setEditingBundle(bundle); setIsModalOpen(true); }} className="text-admin-primary hover:underline">تعديل</button>
                                        <button onClick={() => setBundleToDelete(bundle)} className="text-red-500 hover:underline">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
            )}
        </div>
        
        {isModalOpen && <BundleFormModal bundle={editingBundle} onClose={() => setIsModalOpen(false)} onSave={handleSaveBundle} isSaving={isSaving} categories={categories} allItems={items} />}
        
        <ConfirmationModal
            isOpen={!!bundleToDelete}
            onClose={() => setBundleToDelete(null)}
            onConfirm={confirmDelete}
            title="تأكيد الحذف"
            message={`هل أنت متأكد من رغبتك في حذف الحزمة "${bundleToDelete?.arabicName}"؟`}
            isDestructive={true}
        />
        </>
    );
};

export default AdminBundlesScreen;
