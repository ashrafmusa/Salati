
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { StoreSettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import { SpinnerIcon } from '../assets/icons';
import { getOptimizedImageUrl, uploadToCloudinary } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import { logAdminAction } from '../utils/auditLogger';

const AdminSettingsScreen: React.FC = () => {
    const { user: adminUser } = useAuth();
    const [settings, setSettings] = useState<Partial<StoreSettings>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();
    
    const settingsRef = useMemo(() => doc(db, 'settings', 'store'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(settingsRef, docSnap => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as StoreSettings);
            } else {
                setSettings({ deliveryFee: 0, logoUrl: '', storeAddress: '', announcementText: '', isAnnouncementActive: false });
            }
            setLoading(false);
        }, err => {
            console.error("Error fetching settings:", err);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, [settingsRef]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else {
            setSettings(prev => ({ ...prev, [name]: name === 'deliveryFee' ? Number(value) : value }));
        }
    };
    
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setSettings(prev => ({ ...prev, logoUrl: url }));
            showToast('Logo uploaded. Click Save to apply.', 'info');
        } catch (error: any) {
            showToast(`Logo upload failed: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await setDoc(settingsRef, settings, { merge: true });
            logAdminAction(adminUser, 'Updated Store Settings');
            showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error("Error saving settings:", error);
            showToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputClasses = "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <SpinnerIcon className="w-8 h-8 text-admin-primary animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">إعدادات المتجر العامة</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="deliveryFee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                رسوم التوصيل الافتراضية (بالجنيه السوداني)
                            </label>
                            <input
                                type="number"
                                id="deliveryFee"
                                name="deliveryFee"
                                value={settings.deliveryFee ?? ''}
                                onChange={handleInputChange}
                                className={`${inputClasses} mt-1`}
                                placeholder="e.g., 500"
                            />
                        </div>

                         <div>
                            <label htmlFor="storeAddress" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                عنوان المتجر (للاستلام)
                            </label>
                            <textarea
                                id="storeAddress"
                                name="storeAddress"
                                value={settings.storeAddress || ''}
                                onChange={handleInputChange}
                                rows={3}
                                className={`${inputClasses} mt-1`}
                                placeholder="e.g., Khartoum, Al-Amarat, Street 15"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                سيظهر هذا العنوان للعملاء الذين يختارون استلام طلباتهم من المتجر.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                شعار التطبيق
                            </label>
                            <div className="mt-2 flex items-center gap-4">
                                <img 
                                    src={getOptimizedImageUrl(settings.logoUrl || 'https://via.placeholder.com/150', 200)} 
                                    alt="Logo Preview" 
                                    className="w-24 h-24 rounded-full object-contain shadow-sm bg-slate-100 dark:bg-slate-700"
                                />
                                <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center w-32 h-10">
                                    {isUploading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <span>تغيير الشعار</span>}
                                </label>
                                <input id="logo-upload" type="file" className="hidden" onChange={handleLogoChange} accept="image/png, image/jpeg, image/svg+xml" disabled={isUploading} />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                سيظهر هذا الشعار في رأس الموقع.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">إعلان الموقع</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="announcementText" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                نص الإعلان
                            </label>
                            <input
                                type="text"
                                id="announcementText"
                                name="announcementText"
                                value={settings.announcementText || ''}
                                onChange={handleInputChange}
                                className={`${inputClasses} mt-1`}
                                placeholder="e.g., توصيل مجاني للطلبات فوق 10,000 ج.س!"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isAnnouncementActive" checked={settings.isAnnouncementActive || false} onChange={handleInputChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                            </label>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تفعيل شريط الإعلان</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving || isUploading}
                        className="px-6 py-2 bg-admin-primary text-white font-semibold rounded-lg hover:bg-admin-primary-hover transition-colors disabled:bg-slate-400 flex items-center justify-center w-32"
                    >
                        {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'حفظ التغييرات'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default AdminSettingsScreen;
