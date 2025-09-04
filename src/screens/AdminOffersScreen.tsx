import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { Offer, Product, Discount } from '../types';
import { SpinnerIcon } from '../assets/icons';
import { uploadToCloudinary, getOptimizedImageUrl } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import AdminScreenHeader from '../components/AdminScreenHeader';

const OfferFormModal: React.FC<{
  offer?: Offer | null;
  onClose: () => void;
  onSave: (offer: Offer) => void;
  isSaving: boolean;
  products: Product[];
}> = ({ offer, onClose, onSave, isSaving, products }) => {
    const [formData, setFormData] = useState<Partial<Offer>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

    useEffect(() => {
        if (offer) {
            setFormData({
                ...offer,
                expiryDate: offer.expiryDate.split('T')[0]
            });
            setImagePreview(offer.imageUrl);
        } else {
            setFormData({
                title: '',
                imageUrl: '',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                discount: { type: 'percentage', value: 10, appliesTo: 'all' }
            });
            setImagePreview(null);
        }
    }, [offer]);

    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'imageUrl') setImagePreview(value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDiscountChange = (field: keyof Discount, value: string | number) => {
        const newDiscount = { ...formData.discount, [field]: value } as Discount;

        // Reset target if appliesTo changes
        if (field === 'appliesTo') {
            newDiscount.target = undefined;
        }

        setFormData(prev => ({
            ...prev,
            discount: newDiscount,
        }));
    };
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setImagePreview(url);
            setFormData(prev => ({ ...prev, imageUrl: url }));
        } catch (error: any) {
            alert(`Image upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { title, imageUrl, expiryDate } = formData;
        if (title && imageUrl && expiryDate) {
            const expiry = new Date(expiryDate);
            expiry.setHours(23, 59, 59, 999);
            onSave({ ...formData, expiryDate: expiry.toISOString() } as Offer);
        }
    };

    const discount = formData.discount;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{offer ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input id="title" type="text" name="title" placeholder="عنوان العرض" value={formData.title || ''} onChange={handleChange} className={inputClasses} required />
                    <input id="callToAction" type="text" name="callToAction" placeholder="نص زر الإجراء (اختياري)" value={formData.callToAction || ''} onChange={handleChange} className={inputClasses} />
                    <input id="link" type="text" name="link" placeholder="رابط العرض (اختياري)" value={formData.link || ''} onChange={handleChange} className={inputClasses} />
                    
                    <fieldset className="border dark:border-slate-600 p-4 rounded-md space-y-3">
                        <legend className="px-2 font-semibold text-slate-600 dark:text-slate-300">تفاصيل الخصم</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <select value={discount?.type} onChange={e => handleDiscountChange('type', e.target.value)} className={inputClasses}>
                                <option value="percentage">نسبة مئوية (%)</option>
                                <option value="fixed">مبلغ ثابت (ج.س)</option>
                            </select>
                            <input type="number" value={discount?.value || ''} onChange={e => handleDiscountChange('value', Number(e.target.value))} className={inputClasses} placeholder="قيمة الخصم" required />
                        </div>
                        <select value={discount?.appliesTo} onChange={e => handleDiscountChange('appliesTo', e.target.value)} className={inputClasses}>
                            <option value="all">كل المنتجات</option>
                            <option value="category">فئة محددة</option>
                            <option value="product">منتج محدد</option>
                        </select>
                        {discount?.appliesTo === 'category' && (
                             <select value={discount?.target} onChange={e => handleDiscountChange('target', e.target.value)} className={inputClasses} required>
                                <option value="">اختر الفئة</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        )}
                        {discount?.appliesTo === 'product' && (
                             <select value={discount?.target} onChange={e => handleDiscountChange('target', e.target.value)} className={inputClasses} required>
                                <option value="">اختر المنتج</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.arabicName}</option>)}
                            </select>
                        )}
                    </fieldset>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">صورة العرض</label>
                         <div className="mt-2 flex items-center gap-4">
                            <img src={imagePreview || 'https://via.placeholder.com/150'} alt="Preview" className="w-24 h-24 rounded-md object-cover shadow-sm bg-slate-100" />
                            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center w-32 h-10">
                                {isUploading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'تحميل صورة'}
                            </label>
                            <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" disabled={isUploading}/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ الانتهاء</label>
                        <input id="expiryDate" type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
                    </div>
                    <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-300 dark:bg-slate-600 rounded-md hover:bg-slate-400">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover flex items-center justify-center w-24" disabled={isSaving}>
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DiscountDetails: React.FC<{ discount?: Discount; products: Product[], className?: string }> = ({ discount, products, className="" }) => {
    if (!discount) {
        return <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>لا يوجد خصم مباشر</p>;
    }
    
    const typeText = discount.type === 'percentage' ? '%' : 'ج.س';
    let targetText: React.ReactNode = "كل المنتجات";

    if (discount.appliesTo === 'category') {
        targetText = <>فئة: <span className="font-bold">{discount.target}</span></>;
    } else if (discount.appliesTo === 'product') {
        const productName = products.find(p => p.id === discount.target)?.arabicName || discount.target;
        targetText = <>منتج: <span className="font-bold">{productName}</span></>;
    }

    return (
        <div className={`bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg text-sm ${className}`}>
             <p className="font-semibold text-slate-800 dark:text-slate-200">
                <span className="text-lg text-primary font-bold">{discount.value}{typeText}</span> خصم
            </p>
            <p className="text-slate-600 dark:text-slate-300">
                يطبق على: {targetText}
            </p>
        </div>
    );
};


const AdminOffersScreen: React.FC = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribeOffers = db.collection('offers').onSnapshot(snapshot => {
            setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer)));
            setLoading(false);
        });
        const unsubscribeProducts = db.collection('products').onSnapshot(snapshot => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        });
        return () => {
            unsubscribeOffers();
            unsubscribeProducts();
        };
    }, []);

    const filteredOffers = useMemo(() => {
        return offers.filter(offer =>
            offer.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [offers, searchTerm]);
    
    const handleSaveOffer = async (offerToSave: Offer) => {
        setIsSaving(true);
        const { id, ...offerData } = offerToSave;
        try {
            if (editingOffer) {
                await db.collection('offers').doc(id).update(offerData);
            } else {
                await db.collection('offers').add(offerData);
            }
        } catch (error) {
            console.error("Error saving offer:", error);
        }
        setIsSaving(false);
        setIsModalOpen(false);
        setEditingOffer(null);
    };

    const confirmDelete = async () => {
        if (!offerToDelete) return;
        try {
            await db.collection('offers').doc(offerToDelete.id).delete();
        } catch (error) {
            console.error("Error deleting offer:", error);
        } finally {
            setOfferToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
                <AdminScreenHeader
                    title="إدارة العروض"
                    buttonText="إضافة عرض"
                    onButtonClick={() => { setEditingOffer(null); setIsModalOpen(true); }}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="ابحث بعنوان العرض..."
                />
                
                {loading ? <p>Loading...</p> : (
                    <div className="space-y-4">
                        {filteredOffers.map(offer => {
                            const isExpired = new Date(offer.expiryDate) < new Date();
                            return (
                            <div key={offer.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700 flex flex-col md:flex-row items-start gap-4">
                               <img src={getOptimizedImageUrl(offer.imageUrl, 400)} alt={offer.title} className="w-full md:w-48 h-32 md:h-auto rounded-md object-cover shadow-sm flex-shrink-0" />
                                <div className="flex-grow w-full space-y-2">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100 flex-1">{offer.title}</p>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full flex-shrink-0 ml-3 ${isExpired ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                            {isExpired ? 'منتهي' : 'نشط'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        ينتهي في: {new Date(offer.expiryDate).toLocaleDateString('ar-EG')}
                                    </p>
                                    <DiscountDetails discount={offer.discount} products={products} />
                                </div>
                                <div className="w-full md:w-auto flex-shrink-0 flex md:flex-col justify-end md:justify-start gap-2 self-stretch pt-2 md:pt-0 border-t md:border-t-0 dark:border-slate-700">
                                    <button onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }} className="flex-1 md:flex-none text-admin-primary bg-admin-primary/10 hover:bg-admin-primary/20 text-sm font-semibold px-4 py-2 rounded-md transition">تعديل</button>
                                    <button onClick={() => setOfferToDelete(offer)} className="flex-1 md:flex-none text-red-500 bg-red-500/10 hover:bg-red-500/20 text-sm font-semibold px-4 py-2 rounded-md transition">حذف</button>
                                </div>
                            </div>
                        )})}
                    </div>
                )}

                {isModalOpen && <OfferFormModal offer={editingOffer} onClose={() => setIsModalOpen(false)} onSave={handleSaveOffer} isSaving={isSaving} products={products} />}
            </div>

            <ConfirmationModal
                isOpen={!!offerToDelete}
                onClose={() => setOfferToDelete(null)}
                onConfirm={confirmDelete}
                title="تأكيد الحذف"
                message={`هل أنت متأكد من رغبتك في حذف العرض "${offerToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmText="نعم، احذف"
                cancelText="إلغاء"
                isDestructive={true}
            />
        </>
    );
};

export default AdminOffersScreen;