import React, { useState, useEffect } from 'react';
import { Driver } from '../types';
import { SpinnerIcon } from '../assets/icons';

interface DriverFormModalProps {
  driver?: Driver | null;
  onClose: () => void;
  onSave: (driver: Driver) => void;
  isSaving: boolean;
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({ driver, onClose, onSave, isSaving }) => {
    const [formData, setFormData] = useState<Partial<Driver>>({});

    useEffect(() => {
        if (driver) {
            setFormData(driver);
        } else {
            setFormData({
                name: '',
                phone: '',
                status: 'Available'
            });
        }
    }, [driver]);
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.phone) {
            onSave(formData as Driver);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{driver ? 'تعديل بيانات السائق' : 'إضافة سائق جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">اسم السائق</label>
                        <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                        <input id="phone" type="tel" name="phone" dir="ltr" value={formData.phone || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الحالة</label>
                        <select id="status" name="status" value={formData.status || 'Available'} onChange={handleChange} className={`${inputClasses} mt-1`}>
                            <option value="Available">متاح</option>
                            <option value="On-Delivery">قيد التوصيل</option>
                            <option value="Offline">غير متصل</option>
                        </select>
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

export default DriverFormModal;
