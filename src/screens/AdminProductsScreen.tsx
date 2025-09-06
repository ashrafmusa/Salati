import React, { useState, useEffect, useMemo } from "react";
import { Bundle, Category, Item, BundleContent } from "../types";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { TrashIcon, SpinnerIcon, PlusIcon, SearchIcon } from "../assets/icons";
import {
  calculateBundlePrice,
  uploadToCloudinary,
  getOptimizedImageUrl,
} from "../utils/helpers";
import { useToast } from "../contexts/ToastContext";
import ConfirmationModal from "../components/ConfirmationModal";
import { BeakerIcon } from "../assets/adminIcons";
import IdeaGeneratorModal from "../components/IdeaGeneratorModal";
import { BundleIdea } from "../utils/gemini";
import SortableHeader from "../components/SortableHeader";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";

const BundleFormModal: React.FC<{
  bundle?: Bundle | null;
  onClose: () => void;
  onSave: (bundle: Bundle) => void;
  isSaving: boolean;
  categories: Category[];
  allItems: Item[];
}> = ({ bundle, onClose, onSave, isSaving, categories, allItems }) => {
  const [formData, setFormData] = useState<Partial<Bundle>>({ contents: [] });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (bundle) {
      setFormData(JSON.parse(JSON.stringify(bundle)));
      if (bundle.imageUrl) setImagePreview(bundle.imageUrl);
    } else {
      setFormData({
        id: `bun_${Date.now()}`,
        type: "bundle",
        name: "",
        arabicName: "",
        category: "",
        stock: 0,
        description: "",
        contents: [],
        imageUrl: "",
        availableExtras: [],
      });
      setImagePreview(null);
    }
  }, [bundle]);

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const downloadURL = await uploadToCloudinary(file);
      setImagePreview(downloadURL);
      setFormData((prev) => ({ ...prev, imageUrl: downloadURL }));
    } catch (error: any) {
      showToast(`Image upload failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }));
  };

  const handleContentChange = (
    index: number,
    field: keyof BundleContent,
    value: string | number
  ) => {
    const newContents = [...(formData.contents || [])];
    if (field === "quantity") {
      newContents[index] = { ...newContents[index], [field]: Number(value) };
    } else {
      newContents[index] = { ...newContents[index], [field]: value as string };
    }
    setFormData((prev) => ({ ...prev, contents: newContents }));
  };

  const addContentItem = (item: Item) => {
    const newContents = [...(formData.contents || [])];
    const existingIndex = newContents.findIndex((c) => c.itemId === item.id);
    if (existingIndex > -1) {
      newContents[existingIndex].quantity += 1;
    } else {
      newContents.push({ itemId: item.id, quantity: 1 });
    }
    setFormData((prev) => ({ ...prev, contents: newContents }));
  };

  const removeContentItem = (index: number) => {
    const newContents = [...(formData.contents || [])];
    newContents.splice(index, 1);
    setFormData((prev) => ({ ...prev, contents: newContents }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.arabicName &&
      formData.category &&
      formData.imageUrl &&
      formData.contents &&
      formData.contents.length > 0
    ) {
      onSave(formData as Bundle);
    } else {
      showToast(
        "Please fill all required fields, upload an image, and add at least one item.",
        "error"
      );
    }
  };

  const filteredItems = useMemo(() => {
    return allItems.filter((item) =>
      item.arabicName.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [allItems, itemSearch]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
          {bundle ? "تعديل الحزمة" : "إضافة حزمة جديدة"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input
                type="text"
                name="arabicName"
                placeholder="اسم الحزمة (عربي)"
                value={formData.arabicName || ""}
                onChange={handleChange}
                className={inputClasses}
                required
              />
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
              <input
                type="number"
                name="stock"
                placeholder="المخزون"
                value={formData.stock || ""}
                onChange={handleChange}
                className={inputClasses}
                required
              />
              <input
                type="text"
                name="name"
                placeholder="Bundle Name (English)"
                value={formData.name || ""}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>
            <div className="space-y-4">
              <textarea
                name="description"
                placeholder="الوصف"
                value={formData.description || ""}
                onChange={handleChange}
                rows={3}
                className={inputClasses}
              ></textarea>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  صورة الحزمة
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
                      <span>
                        {imagePreview ? "تغيير الصورة" : "تحميل صورة"}
                      </span>
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
            </div>
          </div>

          {/* Contents Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-slate-700">
            <div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                اختر الأصناف لإضافتها
              </h3>
              <input
                type="search"
                placeholder="ابحث عن صنف..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className={`${inputClasses} mb-2`}
              />
              <div className="h-60 overflow-y-auto border dark:border-slate-700 rounded-md p-2 space-y-1">
                {filteredItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => addContentItem(item)}
                    className="w-full text-right p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-4"
                  >
                    <span className="flex-grow">{item.arabicName}</span>
                    <span className="text-sm text-slate-500 flex-shrink-0">
                      {item.price} ج.س
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                الأصناف في الحزمة
              </h3>
              <div
                className={`h-60 overflow-y-auto border dark:border-slate-700 rounded-md p-2 ${
                  (formData.contents || []).length > 0
                    ? "space-y-2"
                    : "flex items-center justify-center"
                }`}
              >
                {(formData.contents || []).map((content, index) => {
                  const item = allItems.find((i) => i.id === content.itemId);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-1 bg-slate-50 dark:bg-slate-800 rounded"
                    >
                      <span className="text-sm font-medium flex-1">
                        {item?.arabicName}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={content.quantity}
                          onChange={(e) =>
                            handleContentChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-16 p-1 text-center rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeContentItem(index)}
                          className="text-red-500 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(formData.contents || []).length === 0 && (
                  <p className="text-sm text-slate-400">لم يتم إضافة أصناف</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t dark:border-slate-700 mt-4 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-300 dark:bg-slate-600 rounded-md hover:bg-slate-400"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-admin-primary text-white rounded-md hover:bg-admin-primary-hover flex items-center justify-center w-24"
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

const AdminBundlesScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<Bundle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const categoriesQuery = query(
      collection(db, "categories"),
      orderBy("sortOrder")
    );
    unsubs.push(
      onSnapshot(categoriesQuery, (snapshot) => {
        setCategories(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Category)
          )
        );
      })
    );
    const itemsQuery = query(collection(db, "items"));
    unsubs.push(
      onSnapshot(itemsQuery, (snapshot) => {
        setItems(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
        );
      })
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const initialSort = useMemo(
    () => ({ key: "arabicName" as const, direction: "ascending" as const }),
    []
  );

  const {
    documents: paginatedBundles,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    requestSort,
    sortConfig,
  } = usePaginatedFirestore<Bundle>("bundles", initialSort);

  const filteredBundles = useMemo(() => {
    if (!searchTerm) return paginatedBundles;
    return paginatedBundles.filter(
      (bundle) =>
        bundle.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paginatedBundles, searchTerm]);

  const bundlesWithPrices = useMemo(() => {
    return filteredBundles.map((bundle) => ({
      ...bundle,
      calculatedPrice: calculateBundlePrice(bundle, items),
    }));
  }, [filteredBundles, items]);

  const itemsInStock = useMemo(
    () => items.filter((item) => item.stock > 0),
    [items]
  );

  const handleSaveBundle = async (bundleToSave: Bundle) => {
    setIsSaving(true);
    const { id, ...bundleData } = bundleToSave;
    const bundleDocRef = doc(db, "bundles", id);
    try {
      if (editingBundle) {
        await updateDoc(bundleDocRef, bundleData);
        showToast("Bundle updated successfully!", "success");
      } else {
        await setDoc(bundleDocRef, bundleData);
        showToast("Bundle added successfully!", "success");
      }
    } catch (error) {
      showToast("Failed to save bundle.", "error");
    }
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleCreateBundleFromIdea = (idea: BundleIdea) => {
    const itemsInBundle = items.filter((item) =>
      idea.itemNames.includes(item.arabicName)
    );

    const newBundleContents: BundleContent[] = itemsInBundle.map((item) => ({
      itemId: item.id,
      quantity: 1, // Default quantity
    }));

    const newBundle: Partial<Bundle> = {
      id: `bun_${Date.now()}`,
      type: "bundle",
      arabicName: idea.bundleName,
      name: "", // Admin can fill this
      description: idea.description,
      contents: newBundleContents,
      category: "",
      stock: 0,
      imageUrl: "",
      availableExtras: [],
    };

    setEditingBundle(newBundle as Bundle);
    setIsIdeaModalOpen(false);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bundleToDelete) return;
    const bundleDocRef = doc(db, "bundles", bundleToDelete.id);
    try {
      await deleteDoc(bundleDocRef);
      showToast("Bundle deleted successfully.", "success");
    } catch (error) {
      showToast("Failed to delete bundle.", "error");
    } finally {
      setBundleToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 self-start sm:self-center">
            إدارة الحزم
          </h2>
          <div className="w-full sm:w-auto flex flex-col-reverse sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="ابحث عن حزمة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-admin-primary focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
              />
              <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              onClick={() => setIsIdeaModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center bg-primary/10 text-primary font-semibold px-4 py-2 rounded-lg hover:bg-primary/20 transition-all duration-200 whitespace-nowrap"
            >
              <BeakerIcon className="w-5 h-5 ml-2" />
              اقتراح بالـ AI
            </button>
            <button
              onClick={() => {
                setEditingBundle(null);
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-all duration-200"
            >
              <PlusIcon className="w-5 h-5 ml-2" />
              إضافة حزمة
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <p>جار تحميل الحزم...</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b-2 border-slate-100 dark:border-slate-700">
                      <SortableHeader<Bundle>
                        label="اسم الحزمة"
                        sortKey="arabicName"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <SortableHeader<Bundle>
                        label="الفئة"
                        sortKey="category"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        السعر المحسوب
                      </th>
                      <SortableHeader<Bundle>
                        label="المخزون"
                        sortKey="stock"
                        requestSort={requestSort}
                        sortConfig={sortConfig}
                      />
                      <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundlesWithPrices.map((bundle) => (
                      <tr
                        key={bundle.id}
                        className="border-b dark:border-slate-700 hover:bg-sky-100/50 dark:hover:bg-sky-900/20 align-middle"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getOptimizedImageUrl(bundle.imageUrl, 100)}
                              alt={bundle.arabicName}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {bundle.arabicName}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {bundle.category}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {bundle.calculatedPrice} ج.س
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {bundle.stock}
                        </td>
                        <td className="p-3 space-x-4 space-x-reverse">
                          <button
                            onClick={() => {
                              setEditingBundle(bundle);
                              setIsModalOpen(true);
                            }}
                            className="text-admin-primary hover:underline"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => setBundleToDelete(bundle)}
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
                {bundlesWithPrices.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={getOptimizedImageUrl(bundle.imageUrl, 150)}
                        alt={bundle.arabicName}
                        className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-100">
                          {bundle.arabicName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {bundle.category}
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
                            {bundle.calculatedPrice} ج.س
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            المخزون
                          </p>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {bundle.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-4 pt-2">
                        <button
                          onClick={() => {
                            setEditingBundle(bundle);
                            setIsModalOpen(true);
                          }}
                          className="text-admin-primary font-semibold"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setBundleToDelete(bundle)}
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
          )}
        </div>
        <Pagination
          onNext={nextPage}
          onPrev={prevPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
        />
      </div>

      {isModalOpen && (
        <BundleFormModal
          bundle={editingBundle}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBundle}
          isSaving={isSaving}
          categories={categories}
          allItems={items}
        />
      )}

      <ConfirmationModal
        isOpen={!!bundleToDelete}
        onClose={() => setBundleToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من رغبتك في حذف الحزمة "${bundleToDelete?.arabicName}"؟`}
        isDestructive={true}
      />

      <IdeaGeneratorModal
        isOpen={isIdeaModalOpen}
        onClose={() => setIsIdeaModalOpen(false)}
        allItems={itemsInStock}
        onCreateBundle={handleCreateBundleFromIdea}
      />
    </>
  );
};

export default AdminBundlesScreen;
