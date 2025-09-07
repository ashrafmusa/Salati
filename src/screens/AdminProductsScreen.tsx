import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { Item, Category, Bundle, StoreProduct } from "../types";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { getOptimizedImageUrl, exportToCsv } from "../utils/helpers";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../contexts/ToastContext";
import { PackageIcon, PlusIcon } from "../assets/adminIcons";
import SortableHeader from "../components/SortableHeader";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import { logAdminAction } from "../utils/auditLogger";
import { useAuth } from "../hooks/useAuth";
import { useCombinedPaginatedFirestore } from "../hooks/useCombinedPaginatedFirestore";
import ItemFormModal from "../components/ItemFormModal";
import BundleFormModal from "../components/BundleFormModal";
import { useClickOutside } from "../hooks/useClickOutside";

const AdminProductsScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // Modal states
  const [modalType, setModalType] = useState<"item" | "bundle" | null>(null);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(
    null
  );
  const [productToDelete, setProductToDelete] = useState<StoreProduct | null>(
    null
  );
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(addDropdownRef, () => setIsAddDropdownOpen(false));

  const initialSort = useMemo(
    () => ({ key: "arabicName" as const, direction: "ascending" as const }),
    []
  );
  const {
    documents: products,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    requestSort,
    sortConfig,
  } = useCombinedPaginatedFirestore<StoreProduct>(initialSort);

  useEffect(() => {
    const unsubCategories = onSnapshot(
      collection(db, "categories"),
      (snapshot) =>
        setCategories(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Category)
          )
        )
    );
    const unsubItems = onSnapshot(collection(db, "items"), (snapshot) =>
      setAllItems(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
      )
    );
    return () => {
      unsubCategories();
      unsubItems();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((p) =>
      p.arabicName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelectProduct = (productId: string, isSelected: boolean) => {
    setSelectedProductIds((prev) => {
      const newSet = new Set(prev);
      if (isSelected) newSet.add(productId);
      else newSet.delete(productId);
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedProductIds(
      e.target.checked ? new Set(filteredProducts.map((p) => p.id)) : new Set()
    );

  const handleOpenModal = (
    type: "item" | "bundle",
    product: StoreProduct | null = null
  ) => {
    setEditingProduct(product);
    setModalType(type);
  };

  const handleSave = async (productData: StoreProduct) => {
    setIsSaving(true);
    const { id, type, ...data } = productData;
    const collectionName = type === "item" ? "items" : "bundles";
    try {
      if (editingProduct) {
        await updateDoc(doc(db, collectionName, id), data);
        showToast("Product updated successfully!", "success");
      } else {
        await setDoc(doc(db, collectionName, id || `prod_${Date.now()}`), data);
        showToast("Product added successfully!", "success");
      }
      logAdminAction(
        adminUser,
        editingProduct ? "Updated Product" : "Created Product",
        `Name: ${productData.arabicName}`
      );
      setModalType(null);
    } catch (error) {
      showToast("Failed to save product.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const { id, type, arabicName } = productToDelete;
    const collectionName = type === "item" ? "items" : "bundles";
    try {
      await deleteDoc(doc(db, collectionName, id));
      logAdminAction(adminUser, "Deleted Product", `Name: ${arabicName}`);
      showToast("Product deleted.", "success");
    } catch (error) {
      showToast("Failed to delete product.", "error");
    } finally {
      setProductToDelete(null);
    }
  };

  const ProductTypeBadge: React.FC<{ type: "item" | "bundle" }> = ({
    type,
  }) => (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
        type === "item"
          ? "bg-sky-100 text-sky-800 dark:bg-sky-900/50"
          : "bg-purple-100 text-purple-800 dark:bg-purple-900/50"
      }`}
    >
      {type === "item" ? "صنف" : "حزمة"}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <AdminScreenHeader
        title="إدارة المنتجات"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="ابحث عن منتج..."
      />

      <div className="flex justify-end mb-4">
        <div ref={addDropdownRef} className="relative">
          <button
            onClick={() => setIsAddDropdownOpen((p) => !p)}
            className="flex items-center bg-admin-primary text-white px-4 py-2 rounded-lg"
          >
            <PlusIcon className="w-5 h-5 ml-2" /> إضافة منتج
          </button>
          {isAddDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  handleOpenModal("item");
                  setIsAddDropdownOpen(false);
                }}
                className="block w-full text-right px-4 py-2 text-sm"
              >
                إضافة صنف جديد
              </button>
              <button
                onClick={() => {
                  handleOpenModal("bundle");
                  setIsAddDropdownOpen(false);
                }}
                className="block w-full text-right px-4 py-2 text-sm"
              >
                إنشاء حزمة جديدة
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedProductIds.size > 0 &&
                        selectedProductIds.size === filteredProducts.length
                      }
                    />
                  </th>
                  <SortableHeader<StoreProduct>
                    label="المنتج"
                    sortKey="arabicName"
                    requestSort={requestSort}
                    sortConfig={sortConfig}
                  />
                  <th>النوع</th>
                  <th>الفئة</th>
                  <th>المخزون</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b dark:border-slate-700 ${
                      selectedProductIds.has(product.id) ? "bg-sky-100/50" : ""
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.has(product.id)}
                        onChange={(e) =>
                          handleSelectProduct(product.id, e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={getOptimizedImageUrl(product.imageUrl, 100)}
                          alt={product.arabicName}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                        <span>{product.arabicName}</span>
                      </div>
                    </td>
                    <td>
                      <ProductTypeBadge type={product.type} />
                    </td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td className="space-x-4">
                      <button
                        onClick={() => handleOpenModal(product.type, product)}
                        className="text-admin-primary hover:underline"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
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
      <Pagination
        onNext={nextPage}
        onPrev={prevPage}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />

      {modalType === "item" && (
        <ItemFormModal
          item={editingProduct as Item | null}
          onClose={() => setModalType(null)}
          onSave={handleSave as (item: Item) => void}
          isSaving={isSaving}
          categories={categories}
        />
      )}
      {modalType === "bundle" && (
        <BundleFormModal
          bundle={editingProduct as Bundle | null}
          onClose={() => setModalType(null)}
          onSave={handleSave as (bundle: Bundle) => void}
          isSaving={isSaving}
          categories={categories}
          allItems={allItems}
        />
      )}
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${productToDelete?.arabicName}"؟`}
        isDestructive
      />
    </div>
  );
};

export default AdminProductsScreen;
