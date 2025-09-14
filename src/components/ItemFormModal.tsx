import React, { useState, useEffect } from "react";
import { Item, Category, Supplier } from "../types";
import { uploadToCloudinary, getOptimizedImageUrl } from "../utils/helpers";
import { SpinnerIcon } from "../assets/icons";
import { useToast } from "../contexts/ToastContext";

interface ItemFormModalProps {
  item?: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
  isSaving: boolean;
  categories: Category[];
  suppliers: Supplier[];
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  item,
  onClose,
  onSave,
  isSaving,
  categories,
  suppliers,
}) => {
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData(item);
      setImagePreview(item.imageUrl);
    } else {
      setFormData({
        type: "item",
        name: "",
        arabicName: "",
        imageUrl: "",
        category: "",
        description: "",
        costUSD: 0,
        markupPercentage: 25,
        stock: 0,
        isFeatured: false,
      });
      setImagePreview(null);
    }
  }, [item]);

  const validate = (field?: keyof Item) => {
    const newErrors = { ...errors };
    const currentData = formData;

    const checkField = (
      fieldName: keyof Item,
      condition: boolean,
      message: string
    ) => {
      if (condition) newErrors[fieldName] = message;
      else delete newErrors[fieldName];
    };

    if (field === "arabicName" || !field)
      checkField(
        "arabicName",
        !currentData.arabicName?.trim(),
        "اسم الصنف مطلوب"
      );
    if (field === "costUSD" || !field)
      checkField(
        "costUSD",
        (currentData.costUSD ?? 0) <= 0,
        "التكلفة يجب أن تكون أكبر من صفر"
      );
    if (field === "markupPercentage" || !field)
      checkField(
        "markupPercentage",
        (currentData.markupPercentage ?? -1) < 0,
        "هامش الربح لا يمكن أن يكون سالباً"
      );
    if (field === "stock" || !field)
      checkField(
        "stock",
        (currentData.stock ?? -1) < 0,
        "المخزون لا يمكن أن يكون سالباً"
      );
    if (field === "category" || !field)
      checkField("category", !currentData.category, "يجب اختيار فئة");

    setErrors(newErrors);
    // Return false if there are any errors
    return Object.values(newErrors).every((x) => x === undefined || x === "");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;

    if (type === "number") finalValue = Number(value);
    if (type === "checkbox")
      finalValue = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    validate(e.target.name as keyof Item);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImagePreview(url);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      showToast(`Image upload failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && formData.imageUrl) {
      onSave(formData as Item);
    } else if (!formData.imageUrl) {
      showToast("Please upload an image for the item.", "error");
    } else {
      showToast("Please correct the errors in the form.", "error");
    }
  };

  const inputClasses = (name: keyof Item) =>
    `w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
      errors[name] ? "border-red-500" : "border-slate-300 dark:border-slate-600"
    } focus:ring-admin-primary focus:border-admin-primary`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          {item ? "تعديل صنف" : "إضافة صنف جديد"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="arabicName" className="block text-sm font-medium">
                الاسم بالعربي
              </label>
              <input
                id="arabicName"
                name="arabicName"
                value={formData.arabicName || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("arabicName")} mt-1`}
              />
              {errors.arabicName && (
                <p className="text-red-500 text-xs mt-1">{errors.arabicName}</p>
              )}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                الاسم بالانجليزي (اختياري)
              </label>
              <input
                id="name"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("name")} mt-1`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              الوصف
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClasses("description")} mt-1`}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="costUSD" className="block text-sm font-medium">
                سعر التكلفة (USD)
              </label>
              <input
                id="costUSD"
                type="number"
                name="costUSD"
                step="0.01"
                value={formData.costUSD ?? ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("costUSD")} mt-1`}
              />
              {errors.costUSD && (
                <p className="text-red-500 text-xs mt-1">{errors.costUSD}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="markupPercentage"
                className="block text-sm font-medium"
              >
                هامش الربح (%)
              </label>
              <input
                id="markupPercentage"
                type="number"
                name="markupPercentage"
                value={formData.markupPercentage ?? ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("markupPercentage")} mt-1`}
              />
              {errors.markupPercentage && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.markupPercentage}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium">
                المخزون
              </label>
              <input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock ?? ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("stock")} mt-1`}
              />
              {errors.stock && (
                <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium">
                الفئة
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("category")} mt-1`}
              >
                <option value="">اختر فئة</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium">
                المورد
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClasses("supplierId")} mt-1`}
              >
                <option value="">اختر مورد</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">صورة المنتج</label>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={
                  imagePreview
                    ? getOptimizedImageUrl(imagePreview, 200)
                    : "https://via.placeholder.com/150"
                }
                alt="Preview"
                className="w-24 h-24 rounded-md object-cover shadow-sm"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-white dark:bg-slate-700 py-2 px-4 border rounded-md"
              >
                {isUploading ? (
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                ) : (
                  "تحميل صورة"
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
          <div className="flex items-center gap-2">
            <input
              id="isFeatured"
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured || false}
              onChange={handleChange}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium">
              عرض في الصفحة الرئيسية
            </label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose}>
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-admin-primary text-white rounded-md"
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

export default ItemFormModal;
