import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { StoreSettings, ThemeSettings } from "../types";
import { useToast } from "../contexts/ToastContext";
import { SpinnerIcon } from "../assets/icons";
import { getOptimizedImageUrl, uploadToCloudinary } from "../utils/helpers";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";

type SettingsTab = "general" | "theme" | "announcement";

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

  const settingsRef = useMemo(() => doc(db, "settings", "store"), []);

  const sansFontOptions = [
    "Almarai",
    "Tajawal",
    "Cairo",
    "IBM Plex Sans Arabic",
  ];
  const displayFontOptions = ["Montserrat", "Noto Kufi Arabic", "Lemonada"];

  useEffect(() => {
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
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
        [name]: name === "deliveryFee" ? Number(value) : value,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(settingsRef, settings, { merge: true });
      await logAdminAction(adminUser, "Updated Store Settings");
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      showToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

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
        </div>
      </div>

      <div className="p-6">
        {activeTab === "general" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label
                htmlFor="deliveryFee"
                className="block text-sm font-medium"
              >
                رسوم التوصيل
              </label>
              <input
                id="deliveryFee"
                name="deliveryFee"
                value={settings.deliveryFee ?? ""}
                onChange={handleInputChange}
                className={`${inputClasses} mt-1`}
              />
            </div>
            <div>
              <label
                htmlFor="storeAddress"
                className="block text-sm font-medium"
              >
                عنوان المتجر
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
              <label className="block text-sm font-medium">شعار التطبيق</label>
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
                <label htmlFor="sansFont" className="block text-sm font-medium">
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
      </div>
    </form>
  );
};

export default AdminSettingsScreen;
