import React, { useState, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Category } from "../types";
import CategoryFormModal from "../components/CategoryFormModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { getOptimizedImageUrl } from "../utils/helpers";
import AdminScreenHeader from "../components/AdminScreenHeader";
import { CategoryIcon, PlusIcon } from "../assets/adminIcons";
import { useToast } from "../contexts/ToastContext";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";

const AdminCategoriesScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const initialSort = useMemo(
    () => ({ key: "sortOrder" as const, direction: "ascending" as const }),
    []
  );

  const {
    documents: paginatedCategories,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFirestore<Category>("categories", initialSort);

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return paginatedCategories;
    return paginatedCategories.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paginatedCategories, searchTerm]);

  const handleOpenModal = (category: Category | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (categoryToSave: Category) => {
    setIsSaving(true);
    const { id, ...categoryData } = categoryToSave;
    try {
      if (editingCategory) {
        await updateDoc(
          doc(db, "categories", editingCategory.id),
          categoryData
        );
        showToast("Category updated successfully!", "success");
      } else {
        await setDoc(doc(db, "categories", id), categoryData);
        showToast("Category added successfully!", "success");
      }
      await logAdminAction(
        adminUser,
        editingCategory ? "Updated Category" : "Created Category",
        `Name: ${categoryToSave.name}`
      );
    } catch (error) {
      console.error("Error saving category:", error);
      showToast("Failed to save category.", "error");
    } finally {
      setIsSaving(false);
      handleCloseModal();
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteDoc(doc(db, "categories", categoryToDelete.id));
      await logAdminAction(
        adminUser,
        "Deleted Category",
        `Name: ${categoryToDelete.name}`
      );
      showToast("Category deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Failed to delete category.", "error");
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="إدارة فئات المنتجات"
          buttonText="إضافة فئة"
          onButtonClick={() => handleOpenModal()}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="ابحث باسم الفئة..."
        />

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <TableSkeleton />
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-sm border dark:border-slate-700 overflow-hidden flex flex-col"
                >
                  <img
                    src={getOptimizedImageUrl(category.image, 400)}
                    alt={category.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4 flex-grow">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                      {category.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ترتيب العرض: {category.sortOrder}
                    </p>
                  </div>
                  <div className="px-4 pb-4 border-t dark:border-slate-700 mt-2 pt-3 flex gap-2">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="flex-1 bg-admin-primary/10 text-admin-primary font-semibold px-3 py-2 text-sm rounded hover:bg-admin-primary/20 transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(category)}
                      className="flex-1 bg-red-500/10 text-red-500 font-semibold px-3 py-2 text-sm rounded hover:bg-red-500/20 transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <CategoryIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
                {searchTerm ? "لا توجد فئات مطابقة" : "لا توجد فئات بعد"}
              </h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                {searchTerm
                  ? "حاول البحث بكلمة أخرى."
                  : "ابدأ بإضافة فئة جديدة لمنتجاتك."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => handleOpenModal()}
                  className="mt-6 flex items-center mx-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm"
                >
                  <PlusIcon className="w-5 h-5 ml-2" />
                  إضافة فئة
                </button>
              )}
            </div>
          )}
        </div>

        <Pagination
          onNext={nextPage}
          onPrev={prevPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
        />

        {isModalOpen && (
          <CategoryFormModal
            category={editingCategory}
            onClose={handleCloseModal}
            onSave={handleSaveCategory}
            isSaving={isSaving}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من رغبتك في حذف الفئة "${categoryToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </>
  );
};
export default AdminCategoriesScreen;
