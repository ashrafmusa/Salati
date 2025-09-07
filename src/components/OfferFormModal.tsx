import React, { useState, useEffect } from 'react';
// FIX: The `PromotionalBanner` type was renamed to `Offer`. Updated the import to use the correct type name.
import { Offer } from '../types';
import { SpinnerIcon } from '../assets/icons';

interface OfferFormModalProps {
  offer?: Offer | null;
  onClose: () => void;
  onSave: (offer: Offer) => void;
  isSaving: boolean;
}

const OfferFormModal: React.FC<OfferFormModalProps> = ({ offer, onClose, onSave, isSaving }) => {
    const [formData, setFormData] = useState<Partial<Offer>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (offer) {
            setFormData({
                ...offer,
                expiryDate: offer.expiryDate.split('T')[0] // Format for date input
            });
            if (offer.imageUrl) {
                setImagePreview(offer.imageUrl);
            }
        } else {
            setFormData({
                title: '',
                imageUrl: '',
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            setImagePreview(null);
        }
    }, [offer]);
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'imageUrl') {
            setImagePreview(value);
        }
        setFormData(prev => ({...prev, [name]: value }));
    };

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
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title && formData.imageUrl && formData.expiryDate) {
            // Convert date back to ISO string with time
            const expiry = new Date(formData.expiryDate);
            expiry.setHours(23, 59, 59, 999); // Set to end of day
            
            onSave({
                ...formData,
                expiryDate: expiry.toISOString(),
            } as Offer);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{offer ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">عنوان العرض</label>
                        <input id="title" type="text" name="title" value={formData.title || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">صورة العرض</label>
                        <div className="mt-2 flex items-center gap-4">
                           {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-md object-cover shadow-sm" />
                           ) : (
                                <div className="w-24 h-24 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                           )}
                            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                <span>{imagePreview ? 'تغيير الصورة' : 'تحميل صورة'}</span>
                            </label>
                            <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">أو</p>
                        <input type="text" name="imageUrl" placeholder="ألصق رابط الصورة هنا" value={formData.imageUrl || ''} onChange={handleChange} className={`${inputClasses} mt-1 text-xs`} />
                    </div>

                    <div>
                        <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">تاريخ الانتهاء</label>
                        <input id="expiryDate" type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
                    </div>

                    <div className="flex justify-end space-x-4 space-x-reverse pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-300 dark:bg-slate-600 dark:text-slate-100 rounded-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-all duration-200 transform active:scale-95">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95 flex justify-center items-center w-24 disabled:bg-slate-400 dark:disabled:bg-slate-500" disabled={isSaving}>
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OfferFormModal;
