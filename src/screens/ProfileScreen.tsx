
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SubPageHeader from '../components/SubPageHeader';
import { LogoutIcon, HistoryIcon, HeartIcon, ChevronLeftIcon, WarningIcon, KeyIcon, ClipboardListIcon } from '../assets/icons';
import { ShieldCheckIcon } from '../assets/adminIcons';
import ThemeToggle from '../components/ThemeToggle';
// FIX: Removed unused and erroneous getAuth import.
import MetaTagManager from '../components/MetaTagManager';
import { useToast } from '../contexts/ToastContext';

const ProfileScreen: React.FC = () => {
    const { user, firebaseUser, updateUserDetails, logout, sendPasswordResetEmail } = useAuth();
    const { showToast } = useToast();
    
    const signedUpWithPhone = firebaseUser?.providerData?.some(p => p.providerId === 'phone');
    const isProfileIncomplete = !user?.address || !user?.name || user.name === 'عميل جديد' || !user?.phone;
    const isAdmin = user && ['super-admin', 'admin', 'sub-admin', 'driver', 'supplier'].includes(user.role);

    const [isEditing, setIsEditing] = useState(isProfileIncomplete);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        address: user?.address || '',
        phone: user?.phone || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !isEditing) {
            setFormData({
                name: user.name,
                address: user.address || '',
                phone: user.phone || '',
            });
        }
    }, [user, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validatePhone = (phone: string) => {
      if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
        setError("Please enter a valid phone number in E.164 format (e.g., +249912345678).");
        return false;
      }
      setError('');
      return true;
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.address.trim() || !formData.phone.trim()) {
            setError("All fields are required.");
            return;
        }
        if (!signedUpWithPhone && !validatePhone(formData.phone)) {
            return;
        }

        setError('');
        setIsSaving(true);
        try {
            await updateUserDetails(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update user details", error);
            setError("Failed to save details. Please try again.");
        }
        setIsSaving(false);
    };
    
    const handleChangePassword = async () => {
        if (!firebaseUser?.email) {
            showToast("No email associated with this account.", "error");
            return;
        }
        setIsSendingReset(true);
        try {
            await sendPasswordResetEmail(firebaseUser.email);
            showToast(`A password reset link has been sent to ${firebaseUser.email}`, "success");
        } catch (error) {
            showToast("Failed to send password reset link. Please try again later.", "error");
        } finally {
            setIsSendingReset(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
    
    const ProfileLink: React.FC<{ to: string; icon: React.FC<{className?:string}>; label: string }> = ({ to, icon: Icon, label }) => (
        <Link to={to} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-primary" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
            </div>
            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
        </Link>
    );

    return (
        <div>
            <MetaTagManager title="حسابي - سـلـتـي" />
            <SubPageHeader title="حسابي" backPath="/" />
            <div className="p-4 max-w-2xl mx-auto space-y-6">
                
                {isProfileIncomplete && isEditing && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/50 p-4 rounded-lg flex items-center text-center">
                        <WarningIcon className="w-8 h-8 text-yellow-500 ml-4 flex-shrink-0" />
                        <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                            مرحباً بك! يرجى إكمال معلوماتك الشخصية للمتابعة وتأكيد طلباتك.
                        </p>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    {isEditing ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">تعديل الملف الشخصي</h2>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={inputClasses} />
                            </div>
                             <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={inputClasses} disabled={signedUpWithPhone} />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">العنوان</label>
                                <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} className={inputClasses} rows={3}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                {!isProfileIncomplete && <button onClick={handleCancel} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 font-semibold">إلغاء</button>}
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 rounded-md bg-primary text-white font-bold w-24 flex justify-center items-center">
                                    {isSaving ? '...' : 'حفظ'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{user?.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400">{user?.email || user?.phone}</p>
                            </div>
                            <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary hover:underline">تعديل</button>
                        </div>
                    )}
                </div>
                
                <div className="space-y-3">
                    <ProfileLink to="/orders" icon={HistoryIcon} label="طلباتي" />
                    <ProfileLink to="/wishlist" icon={HeartIcon} label="المفضلة" />
                    <ProfileLink to="/my-lists" icon={ClipboardListIcon} label="قوائمي" />
                    {isAdmin && (
                        <a href="./admin.html" className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                                <span className="font-semibold text-slate-700 dark:text-slate-200">لوحة التحكم</span>
                            </div>
                            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
                        </a>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">الوضع الليلي</span>
                        <ThemeToggle />
                    </div>
                     {!signedUpWithPhone && (
                        <div className="flex items-center justify-between pt-4 border-t dark:border-slate-700">
                             <div className="flex items-center gap-4">
                                <KeyIcon className="w-6 h-6 text-slate-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-200">تغيير كلمة المرور</span>
                            </div>
                            <button onClick={handleChangePassword} disabled={isSendingReset} className="text-sm font-semibold text-primary hover:underline">
                                {isSendingReset ? 'جارِ الإرسال...' : 'إرسال رابط'}
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-red-500 rounded-lg text-lg font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                    <LogoutIcon className="w-6 h-6" />
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );
};

export default ProfileScreen;
