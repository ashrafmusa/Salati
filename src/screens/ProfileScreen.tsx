import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SubPageHeader from "../components/SubPageHeader";
import {
  LogoutIcon,
  HistoryIcon,
  HeartIcon,
  ChevronLeftIcon,
  WarningIcon,
  KeyIcon,
} from "../assets/icons";
import ThemeToggle from "../components/ThemeToggle";
// FIX: Removed unused and erroneous getAuth import.
import MetaTagManager from "../components/MetaTagManager";

const ProfileScreen: React.FC = () => {
  const { user, firebaseUser, updateUserDetails, logout } = useAuth();

  const signedUpWithPhone = firebaseUser?.providerData?.some(
    (p) => p.providerId === "phone"
  );
  const isProfileIncomplete =
    !user?.address || !user?.name || user.name === "عميل جديد" || !user?.phone;

  const [isEditing, setIsEditing] = useState(isProfileIncomplete);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    address: user?.address || "",
    phone: user?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name,
        address: user.address || "",
        phone: user.phone || "",
      });
    }
  }, [user, isEditing]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhone = (phone: string) => {
    if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
      setError(
        "Please enter a valid phone number in E.164 format (e.g., +249912345678)."
      );
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (
      !formData.name.trim() ||
      !formData.address.trim() ||
      !formData.phone.trim()
    ) {
      setError("All fields are required.");
      return;
    }
    if (!signedUpWithPhone && !validatePhone(formData.phone)) {
      return;
    }

    setError("");
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

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              المعلومات الشخصية
            </h2>
            {!isEditing && !isProfileIncomplete && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                تعديل
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!!signedUpWithPhone}
                  placeholder="+249XXXXXXXXX"
                  dir="ltr"
                  className={`${inputClasses} ${
                    !!signedUpWithPhone
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      : ""
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  العنوان
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className={inputClasses}
                />
              </div>
              <div className="flex justify-end space-x-3 space-x-reverse pt-2">
                {!isProfileIncomplete && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-600 dark:text-slate-100 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition disabled:bg-slate-400"
                >
                  {isSaving ? "جارِ الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  الاسم:
                </span>{" "}
                {user?.name}
              </p>
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  رقم الهاتف:
                </span>{" "}
                <span dir="ltr">{user?.phone}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  العنوان:
                </span>{" "}
                {user?.address}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm divide-y divide-slate-200 dark:divide-slate-700">
          {user && user.role !== "customer" && (
            <a
              href="./admin.html#/"
              className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center">
                <KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 ml-4" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  لوحة التحكم
                </span>
              </div>
              <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
            </a>
          )}
          <Link
            to="/orders"
            className="flex justify-between items-center p-4 rounded-t-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center">
              <HistoryIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 ml-4" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                سجل الطلبات
              </span>
            </div>
            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
          </Link>
          <Link
            to="/wishlist"
            className="flex justify-between items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center">
              <HeartIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 ml-4" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                المفضلة
              </span>
            </div>
            <ChevronLeftIcon className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex justify-between items-center p-4 rounded-b-lg">
            <div className="flex items-center">
              <span className="text-xl ml-4">🎨</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                المظهر
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={logout}
            className="flex items-center justify-center mx-auto text-red-600 dark:text-red-500 font-semibold py-3 px-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 active:bg-red-100 dark:active:bg-red-900/50 transition-all duration-200"
          >
            <LogoutIcon className="w-5 h-5 ml-2" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
