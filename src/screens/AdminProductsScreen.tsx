
import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductContentItem, Category, ExtraItem } from '../types';
import { db } from '../firebase/config';
// FIX: Added 'PlusIcon' to the import to resolve 'Cannot find name' error on line 183.
import { TrashIcon, SpinnerIcon, PlusIcon } from '../assets/icons';
import { calculateProductTotal, uploadToCloudinary, getOptimizedImageUrl } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';
import AdminScreenHeader from '../components/AdminScreenHeader';

const ProductFormModal: React.FC<{ 
    product?: Product | null, 
    onClose: () => void, 
    onSave: (product: Product) => void, 
    isSaving: boolean,
    categories: Category[],
    allExtras: ExtraItem[]
}> = ({ product, onClose, onSave, isSaving, categories, allExtras }) => {
    const [formData, setFormData] = useState<Partial<Product>>({ availableExtras: [] });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const { showToast } = useToast();

    useEffect(() => {
        if (product) {
            setFormData(JSON.parse(JSON.stringify(product)));
            if (product.imageUrl) setImagePreview(product.imageUrl);
        } else {
            setFormData({ 
                id: `prod${Date.now()}`, 
                name: '', 
                arabicName: '', 
                category: '', 
                stock: 0, 
                description: '', 
                contents: [{ name: '', quantity: '', price: 0, imageUrl: '' }], 
                imageUrl: '',
                availableExtras: []
            });
            setImagePreview(null);
        }
    }, [product]);
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(prev => ({ ...prev, main: true }));
        try {
            const downloadURL = await uploadToCloudinary(file);
            setImagePreview(downloadURL);
            setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
        } catch (error: any) {
            showToast(`Image upload failed: ${error.message}`, 'error');
        } finally {
            setUploading(prev => ({ ...prev, main: false }));
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'stock' ? Number(value) : value }));
    };
    
    const handleContentChange = (index: number, field: keyof ProductContentItem, value: string | number) => {
        const newContents = [...(formData.contents || [])];
        if (field === 'price') {
            newContents[index] = { ...newContents[index], [field]: Number(value) };
        } else {
            newContents[index] = { ...newContents[index], [field]: value as string };
        }
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const handleContentImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const key = `content_${index}`;
        setUploading(prev => ({ ...prev, [key]: true }));
        try {
            const downloadURL = await uploadToCloudinary(file);
            handleContentChange(index, 'imageUrl', downloadURL);
        } catch (error: any) {
            showToast(`Image upload failed: ${error.message}`, 'error');
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleExtraToggle = (extraId: string) => {
        setFormData(prev => {
            const currentExtras = prev.availableExtras || [];
            const newExtras = currentExtras.includes(extraId)
                ? currentExtras.filter(id => id !== extraId)
                : [...currentExtras, extraId];
            return { ...prev, availableExtras: newExtras };
        });
    };

    const addContentRow = () => {
        const newContents = [...(formData.contents || []), { name: '', quantity: '', price: 0, imageUrl: '' }];
        setFormData(prev => ({...prev, contents: newContents }));
    };
    
    const removeContentRow = (index: number) => {
        if (formData.contents && formData.contents.length > 1) {
            const newContents = [...formData.contents];
            newContents.splice(index, 1);
            setFormData(prev => ({ ...prev, contents: newContents }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.arabicName && formData.category && formData.contents && formData.contents.length > 0) {
            onSave(formData as Product);
        } else {
            showToast('Please fill all required fields.', 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <fieldset className="border dark:border-slate-600 p-4 rounded-md">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">المعلومات الأساسية</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <input type="text" name="arabicName" placeholder="اسم المنتج (عربي)" value={formData.arabicName || ''} onChange={handleChange} className={inputClasses} required />
                            <input type="number" name="stock" placeholder="المخزون" value={formData.stock || ''} onChange={handleChange} className={inputClasses} required />
                        </div>
                         <select name="category" value={formData.category || ''} onChange={handleChange} className={`${inputClasses} mt-4`} required>
                            <option value="">اختر الفئة</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                         <input type="text" name="name" placeholder="Product Name (English)" value={formData.name || ''} onChange={handleChange} className={`${inputClasses} mt-4`} required />
                         <textarea name="description" rows={3} placeholder="الوصف التسويقي للمنتج" value={formData.description || ''} onChange={handleChange} className={`${inputClasses} mt-4`} />
                         
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">صورة المنتج</label>
                            <div className="mt-2 flex items-center gap-4">
                               {imagePreview ? (
                                    <img src={getOptimizedImageUrl(imagePreview, 200)} alt="Preview" className="w-24 h-24 rounded-md object-cover shadow-sm" />
                               ) : (
                                    <div className="w-24 h-24 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                               )}
                                <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center w-32 h-10">
                                    {uploading['main'] ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>{imagePreview ? 'تغيير الصورة' : 'تحميل صورة'}</span>}
                                </label>
                                <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={uploading['main']} />
                            </div>
                         </div>
                    </fieldset>

                    <fieldset className="border dark:border-slate-600 p-4 rounded-md">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">محتويات المنتج والأسعار</legend>
                        <div className="mt-2 space-y-4 max-h-60 overflow-y-auto pr-2">
                            {(formData.contents || []).map((item, index) => {
                                const isUploadingContent = uploading[`content_${index}`];
                                return (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 border-t dark:border-slate-700 pt-4 first:border-t-0 first:pt-0">
                                    <div className="space-y-3">
                                        <input type="text" placeholder="اسم المكون" value={item.name} onChange={e => handleContentChange(index, 'name', e.target.value)} className={inputClasses} required />
                                        <div className="grid grid-cols-5 gap-2 items-center">
                                            <input type="text" placeholder="الكمية" value={item.quantity} onChange={e => handleContentChange(index, 'quantity', e.target.value)} className={`col-span-2 ${inputClasses}`} required />
                                            <input type="number" placeholder="السعر" value={item.price} onChange={e => handleContentChange(index, 'price', e.target.value)} className={`col-span-2 ${inputClasses}`} required />
                                            <button type="button" onClick={() => removeContentRow(index)} className="col-span-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 justify-self-center disabled:opacity-50" disabled={(formData.contents?.length || 0) <= 1}>
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <img 
                                                src={getOptimizedImageUrl(item.imageUrl || 'https://storage.googleapis.com/aistudio-hosting/salati/images/placeholder.png', 150)}
                                                alt="Preview" 
                                                className="w-16 h-16 rounded-md object-cover shadow-sm bg-slate-100 dark:bg-slate-700" 
                                            />
                                            <label htmlFor={`item-image-${index}`} className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm w-28 h-9 flex items-center justify-center">
                                                {isUploadingContent ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>تحميل صورة</span>}
                                            </label>
                                            <input id={`item-image-${index}`} type="file" className="hidden" onChange={(e) => handleContentImageChange(e, index)} accept="image/*" disabled={isUploadingContent} />
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                        <button type="button" onClick={addContentRow} className="mt-4 flex items-center gap-1 text-sm text-admin-primary font-semibold hover:underline">
                            <PlusIcon className="w-4 h-4" />
                            <span>إضافة مكون</span>
                        </button>
                    </fieldset>
                    
                    <fieldset className="border dark:border-slate-600 p-4 rounded-md">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">الإضافات الاختيارية</legend>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-48 overflow-y-auto">
                            {allExtras.map(extra => (
                                <label key={extra.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.availableExtras?.includes(extra.id)}
                                        onChange={() => handleExtraToggle(extra.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-200">{extra.name}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>


                    <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700 mt-4">
                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">الإجمالي: {calculateProductTotal(formData)} ج.س</span>
                        <div className="flex justify-end space-x-4 space-x-reverse">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-300 dark:bg-slate-600 dark:text-slate-100 rounded-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-all duration-200 transform active:scale-95">إلغاء</button>
                            <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95 flex justify-center items-center w-24 disabled:bg-slate-400 dark:disabled:bg-slate-500" disabled={isSaving}>
                                {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'حفظ'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminProductsScreen: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [extras, setExtras] = useState<ExtraItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        const unsubscribeProducts = db.collection('products').onSnapshot(snapshot => {
            const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(fetchedProducts);
            setLoading(false);
        });
        const unsubscribeCategories = db.collection('categories').orderBy('sortOrder').onSnapshot(snapshot => {
            const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(fetchedCategories);
        });
        const unsubscribeExtras = db.collection('extras').onSnapshot(snapshot => {
            const fetchedExtras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExtraItem));
            setExtras(fetchedExtras);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
            unsubscribeExtras();
        };
    }, []);
    
    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleOpenModal = (product?: Product) => {
        setEditingProduct(product || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = async (productToSave: Product) => {
        setIsSaving(true);
        const { id, ...productData } = productToSave;
        try {
            if (editingProduct) {
                await db.collection('products').doc(id).update(productData);
                showToast('Product updated successfully!', 'success');
            } else {
                await db.collection('products').doc(id).set(productData);
                showToast('Product added successfully!', 'success');
            }
        } catch (error) {
            console.error("Error saving product:", error);
            showToast('Failed to save product.', 'error');
        }
        setIsSaving(false);
        handleCloseModal();
    };

    const handleDeleteProduct = (product: Product) => {
        setProductToDelete(product);
    };
    
    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await db.collection('products').doc(productToDelete.id).delete();
            showToast('Product deleted successfully.', 'success');
        } catch (error) {
            console.error("Error deleting product:", error);
            showToast('Failed to delete product.', 'error');
        } finally {
            setProductToDelete(null);
        }
    };

    return (
        <>
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
            <AdminScreenHeader
                title="إدارة المنتجات"
                buttonText="إضافة منتج"
                onButtonClick={() => handleOpenModal()}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="ابحث عن منتج..."
            />
            
            {loading ? <p>Loading...</p> : (
            <>
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-right">
                        <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400 w-16"></th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">اسم المنتج</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">الفئة</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">السعر</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">المخزون</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product, index) => (
                                <tr key={product.id} className={`border-b dark:border-slate-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}>
                                    <td className="p-2">
                                        <img src={getOptimizedImageUrl(product.imageUrl, 100)} alt={product.arabicName} className="w-12 h-12 rounded-md object-cover"/>
                                    </td>
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{product.arabicName}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{product.category}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{calculateProductTotal(product)} ج.س</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{product.stock}</td>
                                    <td className="p-3 space-x-4 space-x-reverse">
                                        <button onClick={() => handleOpenModal(product)} className="text-admin-primary hover:underline text-sm font-semibold">تعديل</button>
                                        <button onClick={() => handleDeleteProduct(product)} className="text-red-500 hover:underline text-sm font-semibold">حذف</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4 md:hidden">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700 flex gap-4">
                           <img src={getOptimizedImageUrl(product.imageUrl, 200)} alt={product.arabicName} className="w-20 h-20 rounded-lg object-cover flex-shrink-0"/>
                            <div className="flex-grow space-y-3">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{product.category}</p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{product.arabicName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t dark:border-slate-700">
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">السعر</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{calculateProductTotal(product)} ج.س</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400">المخزون</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">{product.stock}</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-4 pt-2 border-t dark:border-slate-700">
                                    <button onClick={() => handleOpenModal(product)} className="text-admin-primary font-semibold text-sm">تعديل</button>
                                    <button onClick={() => handleDeleteProduct(product)} className="text-red-500 font-semibold text-sm">حذف</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
            )}
        </div>
        
        {isModalOpen && <ProductFormModal product={editingProduct} onClose={handleCloseModal} onSave={handleSaveProduct} isSaving={isSaving} categories={categories} allExtras={extras} />}
        
        <ConfirmationModal
            isOpen={!!productToDelete}
            onClose={() => setProductToDelete(null)}
            onConfirm={confirmDelete}
            title="تأكيد الحذف"
            message={`هل أنت متأكد من رغبتك في حذف المنتج "${productToDelete?.arabicName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
            confirmText="نعم، احذف"
            cancelText="إلغاء"
            isDestructive={true}
        />
        </>
    );
};

export default AdminProductsScreen;