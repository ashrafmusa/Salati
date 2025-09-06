import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Item, Category } from "../types";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { getOptimizedImageUrl, uploadToCloudinary } from "../utils/helpers";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../contexts/ToastContext";
import { SpinnerIcon, PackageIcon, PlusIcon } from "../assets/adminIcons";

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
    const unsubItems = onSnapshot(collection(db, "items"), (snapshot) => {
      setItems(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
      );
      setLoading(false);
    });
    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) => {
        setCategories(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Category)
          )
        );
      }
    );
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
        await updateDoc(doc(db, "items", id), itemData);
        showToast("Item updated!", "success");
      } else {
        await setDoc(doc(db, "items", id), itemData);
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
      await deleteDoc(doc(db, "items", itemToDelete.id));
      showToast("Item deleted.", "success");
    } catch (error) {
      showToast("Failed to delete item.", "error");
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
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

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <p>Loading...</p>
          ) : filteredItems.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
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
              {/* Mobile Card View */}
              <div className="space-y-4 md:hidden">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getOptimizedImageUrl(item.imageUrl, 150)}
                        alt={item.arabicName}
                        className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                          {item.arabicName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-slate-700 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            السعر
                          </p>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {item.price} ج.س
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            المخزون
                          </p>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {item.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 pt-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="text-admin-primary font-semibold"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="text-red-500 font-semibold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <PackageIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
                {searchTerm ? "لا توجد أصناف مطابقة" : "لا توجد أصناف بعد"}
              </h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? "حاول البحث بكلمة أخرى."
                  : "ابدأ بإضافة الأصناف الفردية لمنتجاتك."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-6 flex items-center mx-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm"
                >
                  <PlusIcon className="w-5 h-5 ml-2" />
                  إضافة صنف
                </button>
              )}
            </div>
          )}
        </div>
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
