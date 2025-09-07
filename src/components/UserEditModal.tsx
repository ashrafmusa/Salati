
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { SpinnerIcon } from '../assets/icons';

type PaginatedUser = User & { id: string };

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PaginatedUser;
  onSave: (updatedUser: PaginatedUser) => void;
  isSaving: boolean;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, user, onSave, isSaving }) => {
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    setFormData({
      name: user.name,
      address: user.address || '',
      phone: user.phone || '',
      customDeliveryFee: user.customDeliveryFee,
    });
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'customDeliveryFee') {
        // Allow clearing the field. An empty string will be handled on save.
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
  };

  const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">تعديل بيانات المستخدم: {user.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الاسم الكامل</label>
            <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} className={`${inputClasses} mt-1`} required />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">رقم الهاتف</label>
            <input id="phone" type="tel" name="phone" dir="ltr" value={formData.phone || ''} onChange={handleChange} className={`${inputClasses} mt-1`} />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">العنوان</label>
            <textarea id="address" name="address" value={formData.address || ''} onChange={handleChange} className={`${inputClasses} mt-1`} rows={3}></textarea>
          </div>

          <div>
            <label htmlFor="customDeliveryFee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">رسوم توصيل مخصصة (ج.س)</label>
            <input
              id="customDeliveryFee"
              type="number"
              name="customDeliveryFee"
              value={formData.customDeliveryFee ?? ''}
              onChange={handleChange}
              className={`${inputClasses} mt-1`}
              placeholder="اتركه فارغاً لاستخدام الرسوم الافتراضية"
            />
          </div>

          <div className="flex justify-end space-x-4 space-x-reverse pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-300 dark:bg-slate-600 dark:text-slate-100 rounded-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-all duration-200">إلغاء</button>
            <button type="submit" className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover transition-all duration-200 flex justify-center items-center w-24 disabled:bg-slate-400" disabled={isSaving}>
              {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
