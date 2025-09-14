import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import { StoreSettings, ThemeSettings } from "../types";
import { useToast } from "../contexts/ToastContext";
import { SpinnerIcon } from "../assets/icons";
import { getOptimizedImageUrl, uploadToCloudinary } from "../utils/helpers";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";
import { seedDatabase } from "../firebase/seed";
import ConfirmationModal from "../components/ConfirmationModal";
import fallbackIllustration from "/login-illustration.svg";
import DestructiveConfirmationModal from "../components/DestructiveConfirmationModal";
import { emptyStoreData } from "../firebase/adminUtils";

type SettingsTab = "general" | "theme" | "announcement" | "login";

const ThemePreview: React.FC<{ theme: Partial<ThemeSettings> }> = ({
  theme,
}) => {
  const previewStyle = {
    "--preview-primary": theme.primaryColor || "#007A33",
    "--preview-secondary": theme.secondaryColor || "#D21034",
    fontFamily: theme.sansFont || "Almarai",
  } as React.CSSProperties;

  return (
    <div
      style={previewStyle}
      className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-700"
    >
      <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4">
        معاينة حية
      </h4>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-md shadow-sm">
        <h5
          style={{
            fontFamily: theme.displayFont || "Montserrat",
            color: "var(--preview-primary)",
          }}
          className="text-lg font-bold"
        >
          عنوان المنتج
        </h5>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          هذا النص يظهر بالخط المختار للنصوص العامة.
        </p>
        <div className="flex justify-between items-center mt-3">
          <span
            style={{ color: "var(--preview-secondary)" }}
            className="text-xl font-bold"
          >
            1,234 ج.س
          </span>
          <button
            style={{ backgroundColor: "var(--preview-primary)" }}
            className="text-white font-semibold px-4 py-2 rounded-md text-sm"
          >
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminSettingsScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [settings, setSettings] = useState<Partial<StoreSettings>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isEmptyStoreModalOpen, setIsEmptyStoreModalOpen] = useState(false);
  const [isProcessingEmptyStore, setIsProcessingEmptyStore] = useState(false);

  const settingsRef = useMemo(() => db.collection("settings").doc("store"), []);

  const sansFontOptions = [
    "Almarai",
    "Tajawal",
    "Cairo",
    "IBM Plex Sans Arabic",
  ];
  const displayFontOptions = ["Montserrat", "Noto Kufi Arabic", "Lemonada"];

  useEffect(() => {
    const unsubscribe = settingsRef.onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          setSettings(docSnap.data() as StoreSettings);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [settingsRef]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const themeProperties = [
      "primaryColor",
      "secondaryColor",
      "sansFont",
      "displayFont",
    ];
    if (themeProperties.includes(name)) {
      setSettings((prev) => ({
        ...prev,
        theme: { ...(prev.theme as ThemeSettings), [name]: value },
      }));
    } else if (type === "checkbox") {
      setSettings((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]:
          name === "deliveryFee" || name === "usdToSdgRate"
            ? Number(value)
            : value,
      }));
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setSettings((prev) => ({ ...prev, logoUrl: url }));
      showToast("Logo uploaded. Click Save to apply.", "info");
    } catch (error: any) {
      showToast(`Logo upload failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleIllustrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgContent = event.target?.result as string;
        setSettings((prev) => ({ ...prev, loginIllustrationSvg: svgContent }));
        showToast("Illustration updated. Click Save to apply.", "info");
      };
      reader.readAsText(file);
    } else {
      showToast("Please upload a valid .svg file.", "error");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // FIX: Refactored Firestore setDoc call to use v8 compat syntax.
      await settingsRef.set(settings, { merge: true });
      await logAdminAction(adminUser, "Updated Store Settings");
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      showToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase(db, { force: true });
      await logAdminAction(adminUser, "Seeded Database");
      showToast("Database successfully seeded with dummy data!", "success");
    } catch (error) {
      console.error("Error seeding database from admin panel:", error);
      showToast("Failed to seed database. Check console for details.", "error");
    } finally {
      setIsSeeding(false);
      setIsSeedModalOpen(false);
    }
  };

  const handleEmptyStore = async () => {
    setIsProcessingEmptyStore(true);
    try {
      await emptyStoreData();
      await logAdminAction(adminUser, "Emptied Store Data");
      showToast("All store data has been deleted successfully!", "success");
    } catch (error) {
      console.error("Error emptying store data:", error);
      showToast(
        "Failed to empty the store. Check console for details.",
        "error"
      );
    } finally {
      setIsProcessingEmptyStore(false);
      setIsEmptyStoreModalOpen(false);
    }
  };

  const illustrationSrc = useMemo(() => {
    if (settings?.loginIllustrationSvg) {
      return `data:image/svg+xml;base64,${btoa(settings.loginIllustrationSvg)}`;
    }
    return fallbackIllustration;
  }, [settings]);

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-8 h-8 animate-spin" />
      </div>
    );

  const TabButton: React.FC<{
    tab: SettingsTab;
    children: React.ReactNode;
  }> = ({ tab, children }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-md ${
        activeTab === tab
          ? "bg-admin-primary text-white"
          : "hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-800 rounded-lg shadow-md"
      >
        <div className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">إعدادات المتجر</h2>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2 bg-admin-primary text-white rounded-md w-28"
            >
              {isSaving ? (
                <SpinnerIcon className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "حفظ"
              )}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
            <TabButton tab="general">عام</TabButton>
            <TabButton tab="theme">المظهر</TabButton>
            <TabButton tab="announcement">الإعلان</TabButton>
            {adminUser?.role === "super-admin" && (
              <TabButton tab="login">صفحة الدخول</TabButton>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="deliveryFee"
                    className="block text-sm font-medium"
                  >
                    رسوم التوصيل الافتراضية (ج.س)
                  </label>
                  <input
                    id="deliveryFee"
                    name="deliveryFee"
                    type="number"
                    value={settings.deliveryFee ?? ""}
                    onChange={handleInputChange}
                    className={`${inputClasses} mt-1`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="usdToSdgRate"
                    className="block text-sm font-medium"
                  >
                    سعر صرف الدولار مقابل الجنيه
                  </label>
                  <input
                    id="usdToSdgRate"
                    name="usdToSdgRate"
                    type="number"
                    step="0.1"
                    value={settings.usdToSdgRate ?? ""}
                    onChange={handleInputChange}
                    className={`${inputClasses} mt-1`}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="storeAddress"
                  className="block text-sm font-medium"
                >
                  عنوان المتجر (للاستلام)
                </label>
                <textarea
                  id="storeAddress"
                  name="storeAddress"
                  value={settings.storeAddress || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className={`${inputClasses} mt-1`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  شعار التطبيق
                </label>
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={getOptimizedImageUrl(settings.logoUrl || "", 200)}
                    alt="Logo Preview"
                    className="w-24 h-24 rounded-full object-contain"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer py-2 px-4 border rounded-md"
                  >
                    {isUploading ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      "تغيير الشعار"
                    )}
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === "theme" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="primaryColor"
                      className="block text-sm font-medium"
                    >
                      اللون الأساسي
                    </label>
                    <input
                      id="primaryColor"
                      name="primaryColor"
                      value={settings.theme?.primaryColor || "#000000"}
                      onChange={handleInputChange}
                      type="color"
                      className="w-full h-10 mt-1"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="secondaryColor"
                      className="block text-sm font-medium"
                    >
                      اللون الثانوي
                    </label>
                    <input
                      id="secondaryColor"
                      name="secondaryColor"
                      value={settings.theme?.secondaryColor || "#000000"}
                      onChange={handleInputChange}
                      type="color"
                      className="w-full h-10 mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="sansFont"
                    className="block text-sm font-medium"
                  >
                    خط النصوص
                  </label>
                  <select
                    id="sansFont"
                    name="sansFont"
                    value={settings.theme?.sansFont || "Almarai"}
                    onChange={handleInputChange}
                    className={`${inputClasses} mt-1`}
                  >
                    {sansFontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="displayFont"
                    className="block text-sm font-medium"
                  >
                    خط العناوين
                  </label>
                  <select
                    id="displayFont"
                    name="displayFont"
                    value={settings.theme?.displayFont || "Montserrat"}
                    onChange={handleInputChange}
                    className={`${inputClasses} mt-1`}
                  >
                    {displayFontOptions.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ThemePreview theme={settings.theme || {}} />
            </div>
          )}
          {activeTab === "announcement" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label
                  htmlFor="announcementText"
                  className="block text-sm font-medium"
                >
                  نص الإعلان
                </label>
                <input
                  id="announcementText"
                  name="announcementText"
                  value={settings.announcementText || ""}
                  onChange={handleInputChange}
                  className={`${inputClasses} mt-1`}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isAnnouncementActive"
                  name="isAnnouncementActive"
                  type="checkbox"
                  checked={settings.isAnnouncementActive || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded"
                />
                <label
                  htmlFor="isAnnouncementActive"
                  className="text-sm font-medium"
                >
                  تفعيل شريط الإعلان
                </label>
              </div>
            </div>
          )}
          {activeTab === "login" && adminUser?.role === "super-admin" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold">تخصيص رسم صفحة الدخول</h3>
              <p className="text-sm text-slate-500">
                قم بتحميل ملف SVG مخصص ليظهر في صفحة تسجيل الدخول. سيعود النظام
                إلى الرسم الافتراضي إذا لم يتم تحميل أي ملف.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    معاينة
                  </label>
                  <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-lg p-2">
                    <img
                      src={illustrationSrc}
                      alt="Login Illustration Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="illustration-upload"
                    className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    <span>تحميل ملف SVG جديد</span>
                  </label>
                  <input
                    id="illustration-upload"
                    type="file"
                    className="hidden"
                    onChange={handleIllustrationChange}
                    accept=".svg,image/svg+xml"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {adminUser?.role === "super-admin" && (
          <div className="p-6 border-t dark:border-slate-700">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
              إجراءات المطور
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              هذه الإجراءات تعدل قاعدة البيانات مباشرة. استخدمها بحذر.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsSeedModalOpen(true)}
                className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition"
              >
                ملء البيانات التجريبية
              </button>
              <button
                type="button"
                onClick={() => setIsEmptyStoreModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
              >
                إفراغ بيانات المتجر
              </button>
            </div>
          </div>
        )}
      </form>

      <ConfirmationModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onConfirm={handleSeedDatabase}
        title="ملء قاعدة البيانات ببيانات تجريبية؟"
        message="سيؤدي هذا إلى إضافة مجموعة كاملة من المنتجات والفئات والموردين التجريبيين. يجب استخدام هذا الإجراء فقط على قاعدة بيانات جديدة أو اختبارية لأنه قد ينشئ إدخالات مكررة. هل أنت متأكد من رغبتك في المتابعة؟"
        confirmText={isSeeding ? "جاري الملء..." : "تأكيد والبدء"}
        isDestructive={true}
      />
      <DestructiveConfirmationModal
        isOpen={isEmptyStoreModalOpen}
        onClose={() => setIsEmptyStoreModalOpen(false)}
        onConfirm={handleEmptyStore}
        title="تأكيد إفراغ المتجر"
        message={
          <>
            <p>هذا إجراء خطير جداً ولا يمكن التراجع عنه.</p>
            <p className="font-bold my-2">
              سيتم حذف جميع البيانات التالية بشكل دائم:
            </p>
            <ul className="list-disc list-inside text-sm">
              <li>المنتجات والحزم والإضافات</li>
              <li>العروض والفئات والمراجعات</li>
              <li>الموردون وأوامر الشراء</li>
              <li>السائقون والطلبات وسجلاتها</li>
              <li>الإشعارات وسجلات التدقيق</li>
            </ul>
            <p className="font-bold mt-2 text-amber-500">
              لن يتم حذف حسابات المستخدمين أو إعدادات المتجر.
            </p>
          </>
        }
        confirmText={
          isProcessingEmptyStore ? "جاري الحذف..." : "أؤكد، احذف البيانات"
        }
        confirmationPhrase="DELETE"
        isProcessing={isProcessingEmptyStore}
      />
    </>
  );
};

export default AdminSettingsScreen;
