import React, { useState, useEffect } from 'react';
import { Basket, BasketItem } from '../types';
import { db } from '../firebase/config';
import { PlusIcon, TrashIcon } from '../assets/icons';
import { calculateBasketTotal } from '../utils/helpers';

const BasketFormModal: React.FC<{ basket?: Basket | null, onClose: () => void, onSave: (basket: Basket) => void }> = ({ basket, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Basket>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (basket) {
            setFormData(JSON.parse(JSON.stringify(basket))); // Deep copy to prevent state mutation issues
            if (basket.imageUrl) {
                setImagePreview(basket.imageUrl);
            }
        } else {
            setFormData({ id: `bask${Date.now()}`, name: '', arabicName: '', category: '', stock: 0, description: '', contents: [{ name: '', quantity: '', price: 0 }], imageUrl: '' });
            setImagePreview(null);
        }
    }, [basket]);
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, imageUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'stock' ? Number(value) : value }));
    };
    
    const handleContentChange = (index: number, field: keyof BasketItem, value: string | number) => {
        const newContents = [...(formData.contents || [])];
        if (field === 'price') {
            newContents[index] = { ...newContents[index], [field]: Number(value) };
        } else {
            newContents[index] = { ...newContents[index], [field]: value };
        }
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const addContentRow = () => {
        const newContents = [...(formData.contents || []), { name: '', quantity: '', price: 0 }];
        setFormData(prev => ({...prev, contents: newContents }));
    };
    
    const removeContentRow = (index: number) => {
        if (formData.contents && formData.contents.length > 1) {
            const newContents = [...formData.contents];
            newContents.splice(index, 1);
            setFormData(prev => ({...prev, contents: newContents }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.arabicName && formData.contents && formData.contents.length > 0) {
            onSave(formData as Basket);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{basket ? 'تعديل السلة' : 'إضافة سلة جديدة'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <fieldset className="border dark:border-gray-600 p-4 rounded-md">
                        <legend className="px-2 font-semibold text-gray-600 dark:text-gray-300">المعلومات الأساسية</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <input type="text" name="arabicName" placeholder="اسم السلة (عربي)" value={formData.arabicName || ''} onChange={handleChange} className={inputClasses} required />
                            <input type="number" name="stock" placeholder="المخزون" value={formData.stock || ''} onChange={handleChange} className={inputClasses} required />
                        </div>
                         <select name="category" value={formData.category || ''} onChange={handleChange} className={`${inputClasses} mt-4`} required>
                            <option value="">اختر الفئة</option>
                            {["الأكثر طلباً", "وصل حديثاً", "العائلية", "الاقتصادية"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                         <input type="text" name="name" placeholder="Basket Name (English)" value={formData.name || ''} onChange={handleChange} className={`${inputClasses} mt-4`} required />
                         <textarea name="description" rows={3} placeholder="الوصف التسويقي للسلة" value={formData.description || ''} onChange={handleChange} className={`${inputClasses} mt-4`} />
                         
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">صورة السلة</label>
                            <div className="mt-2 flex items-center gap-4">
                               {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-md object-cover shadow-sm" />
                               ) : (
                                    <div className="w-24 h-24 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                               )}
                                <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                    <span>{imagePreview ? 'تغيير الصورة' : 'تحميل صورة'}</span>
                                </label>
                                <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">أو</p>
                            <input type="text" name="imageUrl" placeholder="ألصق رابط الصورة هنا" value={formData.imageUrl || ''} onChange={handleChange} className={`${inputClasses} mt-1 text-xs`} />
                        </div>
                    </fieldset>

                     <fieldset className="border dark:border-gray-600 p-4 rounded-md">
                        <legend className="px-2 font-semibold text-gray-600 dark:text-gray-300">محتويات السلة والأسعار</legend>
                        <div className="mt-2">
                            <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">المنتجات</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                               {(formData.contents || []).map((item, index) => (
                                   <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                       <input type="text" placeholder="اسم المنتج" value={item.name} onChange={e => handleContentChange(index, 'name', e.target.value)} className={`col-span-5 ${inputClasses}`} />
                                       <input type="text" placeholder="الكمية" value={item.quantity} onChange={e => handleContentChange(index, 'quantity', e.target.value)} className={`col-span-3 ${inputClasses}`} />
                                       <input type="number" placeholder="السعر" value={item.price} onChange={e => handleContentChange(index, 'price', e.target.value)} className={`col-span-3 ${inputClasses}`} />
                                       <button type="button" onClick={() => removeContentRow(index)} className="col-span-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 justify-self-center disabled:opacity-50" disabled={(formData.contents?.length || 0) <= 1}>
                                           <TrashIcon className="w-5 h-5"/>
                                       </button>
                                   </div>
                               ))}
                            </div>
                            <button type="button" onClick={addContentRow} className="mt-2 text-sm text-admin-primary font-semibold hover:underline">+ إضافة منتج</button>
                        </div>
                    </fieldset>

                    <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-4">
                        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">الإجمالي: {calculateBasketTotal(formData)} ج.س</span>
                        <div className="flex justify-end space-x-4 space-x-reverse">
                            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-300 dark:bg-gray-600 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 transform active:scale-95">إلغاء</button>
                            <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95">حفظ</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminBasketsScreen: React.FC = () => {
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBasket, setEditingBasket] = useState<Basket | null>(null);

    useEffect(() => {
        const unsubscribe = db.collection('baskets').onSnapshot(snapshot => {
            const fetchedBaskets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Basket));
            setBaskets(fetchedBaskets);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleOpenModal = (basket?: Basket) => {
        setEditingBasket(basket || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBasket(null);
    };

    const handleSaveBasket = async (basketToSave: Basket) => {
        const { id, ...basketData } = basketToSave;
        try {
            if (editingBasket) {
                // Update existing basket
                await db.collection('baskets').doc(id).update(basketData);
            } else {
                // Add new basket
                await db.collection('baskets').doc(id).set(basketData);
            }
        } catch (error) {
            console.error("Error saving basket:", error);
        }
        handleCloseModal();
    };

    const handleDeleteBasket = async (basketId: string) => {
        if (window.confirm("Are you sure you want to delete this basket?")) {
            try {
                await db.collection('baskets').doc(basketId).delete();
            } catch (error) {
                console.error("Error deleting basket:", error);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">قائمة السلال</h2>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center bg-admin-primary text-white px-4 py-2 rounded hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95">
                    <PlusIcon className="w-5 h-5 ml-2" />
                    إضافة سلة
                </button>
            </div>
            
            {loading ? <p>Loading...</p> : (
            <>
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                    <thead>
                        <tr className="border-b dark:border-gray-700">
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">اسم السلة</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">الفئة</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">السعر</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">المخزون</th>
                            <th className="p-3 text-sm font-semibold text-gray-500 dark:text-gray-400">إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {baskets.map(basket => (
                            <tr key={basket.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3 font-medium text-gray-700 dark:text-gray-200 flex items-center">
                                    <img src={basket.imageUrl} alt={basket.arabicName} className="w-10 h-10 rounded-md object-cover ml-4 shadow-sm" />
                                    {basket.arabicName}
                                </td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{basket.category}</td>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{calculateBasketTotal(basket)} ج.س</td>
                                <td className={`p-3 font-semibold ${ (basket.stock || 0) < 20 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{basket.stock}</td>
                                <td className="p-3 space-x-4 space-x-reverse">
                                    <button 
                                        onClick={() => handleOpenModal(basket)} 
                                        className="text-admin-primary hover:underline text-sm font-semibold"
                                    >
                                        تعديل
                                    </button>
                                     <button 
                                        onClick={() => handleDeleteBasket(basket.id)} 
                                        className="text-red-500 hover:underline text-sm font-semibold"
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="space-y-4 md:hidden">
                {baskets.map(basket => (
                    <div key={basket.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg shadow-md border dark:border-gray-700">
                        <div className="flex items-start">
                           <img src={basket.imageUrl} alt={basket.arabicName} className="w-16 h-16 rounded-md object-cover ml-4 shadow-sm flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="font-bold text-gray-800 dark:text-gray-100">{basket.arabicName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{basket.category}</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-50 mt-1">{calculateBasketTotal(basket)} ج.س</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t dark:border-gray-700 flex justify-between items-center">
                             <p className={`font-semibold px-2 py-1 rounded-full text-xs ${ (basket.stock || 0) < 20 ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'}`}>المخزون: {basket.stock}</p>
                            <div className="space-x-4 space-x-reverse">
                                <button onClick={() => handleOpenModal(basket)} className="text-admin-primary hover:underline text-sm font-semibold">تعديل</button>
                                <button onClick={() => handleDeleteBasket(basket.id)} className="text-red-500 hover:underline text-sm font-semibold">حذف</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </>
            )}

            {isModalOpen && <BasketFormModal basket={editingBasket} onClose={handleCloseModal} onSave={handleSaveBasket} />}
        </div>
    );
};

export default AdminBasketsScreen;