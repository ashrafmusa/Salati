import React, { useState, useEffect } from "react";
// FIX: Reverted the react-router-dom namespace import to standard named imports to resolve TypeScript errors and follow library conventions.
import { useNavigate, Link } from "react-router-dom";
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
import { ShieldCheckIcon } from "../assets/adminIcons";
import ThemeToggle from "../components/ThemeToggle";
// FIX: Removed unused and erroneous getAuth import.
import MetaTagManager from "../components/MetaTagManager";
import { useToast } from "../contexts/ToastContext";

const ProfileScreen: React.FC = () => {
  const {
    user,
    firebaseUser,
    updateUserDetails,
    logout,
    sendPasswordResetEmail,
  } = useAuth();
  const { showToast } = useToast();

  const signedUpWithPhone = firebaseUser?.providerData?.some(
    (p) => p.providerId === "phone"
  );
  const isProfileIncomplete =
    !user?.address || !user?.name || user.name === "عميل جديد" || !user?.phone;
  const isAdmin =
    user &&
    ["super-admin", "admin", "sub-admin", "driver", "supplier"].includes(
      user.role
    );

  const [isEditing, setIsEditing] = useState(isProfileIncomplete);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    address: user?.address || "",
    phone: user?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const handleChangePassword = async () => {
    if (!firebaseUser?.email) {
      showToast("No email associated with this account.", "error");
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(firebaseUser.email);
      showToast(
        `A password reset link has been sent to ${firebaseUser.email}`,
        "success"
      );
    } catch (error) {
      showToast(
        "Failed to send password reset link. Please try again later.",
        "error"
      );
    } finally {
      setIsSendingReset(false);
    }
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
                    !!signedUpWithPhone ? "bg-slate-100 dark:bg-slate-800" : ""
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  العنوان
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                {!isProfileIncomplete && (
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-md bg-primary text-white w-24 flex justify-center items-center"
                >
                  {isSaving ? "..." : "حفظ"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-slate-700 dark:text-slate-200">
              <p>
                <strong>الاسم:</strong> {user?.name}
              </p>
              <p>
                <strong>رقم الهاتف:</strong>{" "}
                <span dir="ltr">{user?.phone}</span>
              </p>
              <p>
                <strong>العنوان:</strong> {user?.address}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <ul className="divide-y dark:divide-slate-700">
            {isAdmin && (
              <li className="p-2">
                <a
                  href="./admin.html"
                  className="flex justify-between items-center w-full text-right hover:text-primary"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-6 h-6" />
                    لوحة التحكم
                  </span>
                  <ChevronLeftIcon className="w-5 h-5" />
                </a>
              </li>
            )}
            <li className="p-2">
              <Link
                to="/orders"
                className="flex justify-between items-center w-full text-right hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <HistoryIcon className="w-6 h-6" />
                  طلباتي
                </span>
                <ChevronLeftIcon className="w-5 h-5" />
              </Link>
            </li>
            <li className="p-2">
              <Link
                to="/wishlist"
                className="flex justify-between items-center w-full text-right hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <HeartIcon className="w-6 h-6" />
                  المفضلة
                </span>
                <ChevronLeftIcon className="w-5 h-5" />
              </Link>
            </li>
            {!signedUpWithPhone && (
              <li className="p-2">
                <button
                  onClick={handleChangePassword}
                  disabled={isSendingReset}
                  className="flex justify-between items-center w-full text-right hover:text-primary disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6" />
                    {isSendingReset ? "جاري الإرسال..." : "تغيير كلمة المرور"}
                  </span>
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex justify-between items-center">
          <span className="font-semibold">المظهر الداكن</span>
          <ThemeToggle />
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              logout().then(() => navigate("/"));
            }}
            className="flex items-center gap-2 mx-auto text-red-500 font-semibold p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50"
          >
            <LogoutIcon className="w-6 h-6" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
