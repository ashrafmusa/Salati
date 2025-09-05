import React, { useState, useEffect } from "react";
import { Category } from "../types";
import { uploadToCloudinary, getOptimizedImageUrl } from "../utils/helpers";
import { SpinnerIcon } from "../assets/icons";

interface CategoryFormModalProps {
  category?: Category | null;
  onClose: () => void;
  onSave: (category: Category) => void;
  isSaving: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  category,
  onClose,
  onSave,
  isSaving,
}) => {
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData(category);
      setImagePreview(category.image);
    } else {
      // Create mode: initialize with a blank form and a client-side temporary ID
      setFormData({
        id: `cat_${Date.now()}`,
        name: "",
        image: "",
        sortOrder: 0,
      });
      setImagePreview(null);
    }
  }, [category]);

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "sortOrder" ? Number(value) : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // CRITICAL FIX: Always wait for the final URL from the upload service.
      // Never save a local file object or a temporary base64 data URL to the database.
      const downloadURL = await uploadToCloudinary(file);
      setImagePreview(downloadURL);
      // Only update the form data with the permanent, final URL.
      setFormData((prev) => ({ ...prev, image: downloadURL }));
    } catch (error: any) {
      console.error("Error uploading category image:", error);
      alert(`Image upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure that the image field contains a valid URL before saving.
    if (formData.name && formData.image) {
      onSave(formData as Category);
    } else {
      alert("Please provide a name and image for the category.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          {category ? `تعديل الفئة: ${category.name}` : "إضافة فئة جديدة"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              اسم الفئة
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className={`${inputClasses} mt-1`}
              required
            />
          </div>

          <div>
            <label
              htmlFor="sortOrder"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              ترتيب العرض
            </label>
            <input
              id="sortOrder"
              type="number"
              name="sortOrder"
              value={formData.sortOrder ?? 0}
              onChange={handleChange}
              className={`${inputClasses} mt-1`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              صورة الفئة
            </label>
            <div className="mt-2 flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={getOptimizedImageUrl(imagePreview, 200)}
                  alt="Preview"
                  className="w-24 h-24 rounded-md object-cover shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center w-32 h-10"
              >
                {isUploading ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{imagePreview ? "تغيير الصورة" : "تحميل صورة"}</span>
                )}
              </label>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                onChange={handleImageChange}
                accept="image/*"
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 space-x-reverse pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-300 dark:bg-slate-600 dark:text-slate-100 rounded-md hover:bg-slate-400 dark:hover:bg-slate-500 transition-all duration-200 transform active:scale-95"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95 flex justify-center items-center w-24 disabled:bg-slate-400 dark:disabled:bg-slate-500"
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <SpinnerIcon className="w-5 h-5 animate-spin" />
              ) : (
                "حفظ"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;
