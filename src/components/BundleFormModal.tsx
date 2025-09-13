import React, { useState, useEffect, useRef } from 'react';
import { Bundle, Item, Category, BundleContent } from '../types';
import { uploadToCloudinary, getOptimizedImageUrl } from '../utils/helpers';
import { SpinnerIcon, TrashIcon } from '../assets/icons';
import { useToast } from '../contexts/ToastContext';
import { useClickOutside } from '../hooks/useClickOutside';

interface BundleFormModalProps {
  bundle?: Bundle | null;
  onClose: () => void;
  onSave: (bundle: Bundle) => void;
  isSaving: boolean;
  categories: Category[];
  allItems: Item[];
}

const BundleFormModal: React.FC<BundleFormModalProps> = ({ bundle, onClose, onSave, isSaving, categories, allItems }) => {
    const [formData, setFormData] = useState<Partial<Bundle>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { showToast } = useToast();
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

    useEffect(() => {
        if (bundle) {
            setFormData(bundle);
            setImagePreview(bundle.imageUrl);
        } else {
            setFormData({
                type: 'bundle',
                name: '', arabicName: '', imageUrl: '', category: '',
                description: '', contents: [], stock: 0,
            });
            setImagePreview(null);
        }
    }, [bundle]);

    const validate = (field?: keyof Bundle) => {
        const newErrors = { ...errors };
        const currentData = formData;

        const checkField = (fieldName: keyof Bundle, condition: boolean, message: string) => {
            if (condition) newErrors[fieldName] = message;
            else delete newErrors[fieldName];
        };

        if (field === 'arabicName' || !field) checkField('arabicName', !currentData.arabicName?.trim(), "اسم الحزمة مطلوب");
        if (field === 'stock' || !field) checkField('stock', (currentData.stock ?? -1) < 0, "المخزون لا يمكن أن يكون سالباً");
        if (field === 'category' || !field) checkField('category', !currentData.category, "يجب اختيار فئة");
        if (field === 'contents' || !field) checkField('contents', !currentData.contents || currentData.contents.length === 0, "يجب أن تحتوي الحزمة على صنف واحد على الأقل");
        
        setErrors(newErrors);
        return Object.values(newErrors).every(x => x === undefined || x === '');
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        validate(e.target.name as keyof Bundle);
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
            showToast(`Image upload failed: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddItem = (item: Item) => {
        const newContents = [...(formData.contents || []), { itemId: item.id, quantity: 1 }];
        setFormData(prev => ({ ...prev, contents: newContents }));
        validate('contents');
        setSearchTerm('');
        setIsDropdownOpen(false);
    };
    
    const handleRemoveItem = (itemId: string) => {
        const newContents = (formData.contents || []).filter(c => c.itemId !== itemId);
        setFormData(prev => ({ ...prev, contents: newContents }));
        validate('contents');
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        const newQuantity = Math.max(1, quantity);
        const newContents = (formData.contents || []).map(c => c.itemId === itemId ? { ...c, quantity: newQuantity } : c);
        setFormData(prev => ({ ...prev, contents: newContents }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate() && formData.imageUrl) {
            onSave(formData as Bundle);
        } else if (!formData.imageUrl) {
            showToast("Please upload an image for the bundle.", "error");
        } else {
            showToast("Please correct the errors in the form.", "error");
        }
    };
    
    const filteredItems = allItems.filter(item =>
        item.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !(formData.contents || []).some(c => c.itemId === item.id)
    );

    const inputClasses = (name: keyof Bundle) => `w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${errors[name] ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} focus:ring-admin-primary focus:border-admin-primary`;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{bundle ? 'تعديل حزمة' : 'إنشاء حزمة جديدة'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Info */}
                    <input id="arabicName" name="arabicName" value={formData.arabicName || ''} onChange={handleChange} onBlur={handleBlur} placeholder="اسم الحزمة بالعربي" className={inputClasses('arabicName')} />
                    {errors.arabicName && <p className="text-red-500 text-xs mt-1">{errors.arabicName}</p>}
                    <textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} onBlur={handleBlur} placeholder="الوصف" className={inputClasses('description')} rows={2} />
                    <div className="grid grid-cols-2 gap-4">
                        <input id="stock" type="number" name="stock" value={formData.stock ?? ''} onChange={handleChange} onBlur={handleBlur} placeholder="المخزون" className={inputClasses('stock')} />
                        <select id="category" name="category" value={formData.category || ''} onChange={handleChange} onBlur={handleBlur} className={inputClasses('category')}>
                            <option value="">اختر فئة</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                     {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                     {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    
                    {/* Image Upload */}
                     <div>
                        <label className="block text-sm font-medium">صورة الحزمة</label>
                        <div className="mt-2 flex items-center gap-4">
                           <img src={imagePreview ? getOptimizedImageUrl(imagePreview, 200) : 'https://via.placeholder.com/150'} alt="Preview" className="w-24 h-24 rounded-md object-cover" />
                           <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-slate-700 py-2 px-4 border rounded-md">
                               {isUploading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'تحميل صورة'}
                           </label>
                           <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} disabled={isUploading} />
                        </div>
                    </div>

                    {/* Contents Management */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">محتويات الحزمة</h3>
                        {errors.contents && <p className="text-red-500 text-xs mb-2">{errors.contents}</p>}
                        <div className="space-y-2">
                           {(formData.contents || []).map(content => {
                               const item = allItems.find(i => i.id === content.itemId);
                               if (!item) return null;
                               return (
                                   <div key={item.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-md">
                                       <span>{item.arabicName}</span>
                                       <div className="flex items-center gap-2">
                                           <input type="number" value={content.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))} className="w-16 p-1 text-center border rounded"/>
                                           <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                       </div>
                                   </div>
                               );
                           })}
                        </div>
                        <div ref={dropdownRef} className="relative mt-4">
                            <input type="text" placeholder="ابحث لإضافة صنف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={() => setIsDropdownOpen(true)} className="w-full p-2 border rounded-md" />
                            {isDropdownOpen && filteredItems.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border rounded-md mt-1 max-h-48 overflow-y-auto">
                                   {filteredItems.map(item => (
                                       <li key={item.id} onClick={() => handleAddItem(item)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">{item.arabicName}</li>
                                   ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2">إلغاء</button>
                        <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md" disabled={isSaving || isUploading}>
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'حفظ الحزمة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BundleFormModal;