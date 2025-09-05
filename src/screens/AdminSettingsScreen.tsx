import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { StoreSettings } from '../types';
import { useToast } from '../contexts/ToastContext';
import { SpinnerIcon } from '../assets/icons';

const AdminSettingsScreen: React.FC = () => {
    const [settings, setSettings] = useState<Partial<StoreSettings>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const settingsRef = doc(db, 'settings', 'store');
        const unsubscribe = onSnapshot(settingsRef, docSnap => {
            if (docSnap.exists()) {
                setSettings(docSnap.data() as StoreSettings);
            } else {
                setSettings({ deliveryFee: 0 });
            }
            setLoading(false);
        }, err => {
            console.error("Error fetching settings:", err);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'store'), settings, { merge: true });
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
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">إعدادات المتجر العامة</h2>
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label htmlFor="deliveryFee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            رسوم التوصيل (بالجنيه السوداني)
                        </label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-slate-500 dark:text-slate-400 sm:text-sm">ج.س</span>
                            </div>
                            <input
                                type="number"
                                id="deliveryFee"
                                name="deliveryFee"
                                value={settings.deliveryFee ?? ''}
                                onChange={handleInputChange}
                                className={`${inputClasses} pr-12 text-left`}
                                placeholder="e.g., 500"
                                dir="ltr"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            هذه هي رسوم التوصيل الافتراضية التي ستطبق على جميع الطلبات.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-admin-primary text-white font-semibold rounded-lg hover:bg-admin-primary-hover transition-colors disabled:bg-slate-400 flex items-center justify-center w-32"
                        >
                            {isSaving ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// FIX: Added default export to fix lazy loading issue.
export default AdminSettingsScreen;