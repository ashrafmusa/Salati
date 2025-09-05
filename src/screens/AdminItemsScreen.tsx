import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import { Item, Category } from "../types";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { getOptimizedImageUrl, uploadToCloudinary } from "../utils/helpers";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../contexts/ToastContext";
import { SpinnerIcon } from "../assets/icons";

const ItemFormModal: React.FC<{
  item?: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
  isSaving: boolean;
  categories: Category[];
}> = ({ item, onClose, onSave, isSaving, categories }) => {
  const [formData, setFormData] = useState<Partial<Item>>({});
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        id: `item_${Date.now()}`,
        type: "item",
        name: "",
        arabicName: "",
        category: "",
        description: "",
        price: 0,
        stock: 0,
        imageUrl: "",
      });
    }
  }, [item]);

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      showToast(`Image upload failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.arabicName && formData.category && formData.imageUrl) {
      onSave(formData as Item);
    } else {
      showToast("Please fill all required fields.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {item ? "تعديل الصنف" : "إضافة صنف جديد"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="arabicName"
              value={formData.arabicName || ""}
              onChange={handleChange}
              placeholder="الاسم (عربي)"
              className={inputClasses}
              required
            />
            <input
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Name (English)"
              className={inputClasses}
              required
            />
            <input
              name="price"
              type="number"
              value={formData.price || ""}
              onChange={handleChange}
              placeholder="السعر"
              className={inputClasses}
              required
            />
            <input
              name="stock"
              type="number"
              value={formData.stock || ""}
              onChange={handleChange}
              placeholder="المخزون"
              className={inputClasses}
              required
            />
          </div>
          <select
            name="category"
            value={formData.category || ""}
            onChange={handleChange}
            className={inputClasses}
            required
          >
            <option value="">اختر الفئة</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="الوصف"
            rows={3}
            className={inputClasses}
          ></textarea>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              صورة الصنف
            </label>
            <div className="mt-2 flex items-center gap-4">
              <img
                src={getOptimizedImageUrl(formData.imageUrl || "", 200)}
                alt="Preview"
                className="w-24 h-24 rounded-md object-cover shadow-sm bg-slate-100"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer bg-white dark:bg-slate-700 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center w-32 h-10"
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
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 rounded-md"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-admin-primary text-white rounded-md"
              disabled={isSaving || isUploading}
            >
              {isSaving ? "جارِ الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminItemsScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubItems = db.collection("items").onSnapshot((snapshot) => {
      setItems(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
      );
      setLoading(false);
    });
    const unsubCategories = db
      .collection("categories")
      .onSnapshot((snapshot) => {
        setCategories(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Category)
          )
        );
      });
    return () => {
      unsubItems();
      unsubCategories();
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.arabicName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleSaveItem = async (itemToSave: Item) => {
    setIsSaving(true);
    const { id, ...itemData } = itemToSave;
    try {
      if (editingItem) {
        await db.collection("items").doc(id).update(itemData);
        showToast("Item updated!", "success");
      } else {
        await db.collection("items").doc(id).set(itemData);
        showToast("Item added!", "success");
      }
    } catch (error) {
      showToast("Failed to save item.", "error");
    }
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await db.collection("items").doc(itemToDelete.id).delete();
      showToast("Item deleted.", "success");
    } catch (error) {
      showToast("Failed to delete item.", "error");
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="إدارة الأصناف"
          buttonText="إضافة صنف"
          onButtonClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="ابحث عن صنف..."
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-700">
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    الصنف
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    الفئة
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    السعر
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    المخزون
                  </th>
                  <th className="p-3 text-sm font-semibold text-slate-500">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b dark:border-slate-700 hover:bg-sky-100/50"
                  >
                    <td className="p-3 flex items-center gap-3">
                      <img
                        src={getOptimizedImageUrl(item.imageUrl, 100)}
                        alt={item.arabicName}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <span className="font-medium">{item.arabicName}</span>
                    </td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.price} ج.س</td>
                    <td className="p-3">{item.stock}</td>
                    <td className="p-3 space-x-4 space-x-reverse">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsModalOpen(true);
                        }}
                        className="text-admin-primary hover:underline"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="text-red-500 hover:underline"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isModalOpen && (
        <ItemFormModal
          item={editingItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveItem}
          isSaving={isSaving}
          categories={categories}
        />
      )}
      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message={`Delete item "${itemToDelete?.arabicName}"?`}
        isDestructive
      />
    </>
  );
};

export default AdminItemsScreen;
