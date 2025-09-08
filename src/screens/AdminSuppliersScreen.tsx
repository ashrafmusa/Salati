import React, { useState, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Supplier } from "../types";
import AdminScreenHeader from "../components/AdminScreenHeader";
import ConfirmationModal from "../components/ConfirmationModal";
import { useToast } from "../contexts/ToastContext";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/TableSkeleton";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";
import SupplierFormModal from "../components/SupplierFormModal";

const AdminSuppliersScreen: React.FC = () => {
  const { user: adminUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const initialSort = useMemo(
    () => ({ key: "name" as const, direction: "ascending" as const }),
    []
  );
  const {
    documents: suppliers,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFirestore<Supplier>("suppliers", initialSort);

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSave = async (supplierData: Supplier) => {
    setIsSaving(true);
    try {
      if (editingSupplier) {
        const { id, ...data } = supplierData;
        await updateDoc(doc(db, "suppliers", id), data);
        showToast("Supplier updated!", "success");
      } else {
        await addDoc(collection(db, "suppliers"), supplierData);
        showToast("Supplier added!", "success");
      }
      logAdminAction(
        adminUser,
        editingSupplier ? "Updated Supplier" : "Created Supplier",
        `Name: ${supplierData.name}`
      );
      setIsModalOpen(false);
    } catch (error) {
      showToast("Failed to save supplier.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteDoc(doc(db, "suppliers", supplierToDelete.id));
      logAdminAction(
        adminUser,
        "Deleted Supplier",
        `Name: ${supplierToDelete.name}`
      );
      showToast("Supplier deleted.", "success");
    } catch (error) {
      showToast("Failed to delete supplier.", "error");
    } finally {
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <AdminScreenHeader
        title="إدارة الموردين"
        buttonText="إضافة مورد"
        onButtonClick={() => handleOpenModal()}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="ابحث عن مورد..."
      />

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3">جهة الاتصال</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="p-3 font-medium">{supplier.name}</td>
                    <td className="p-3">{supplier.contactPerson}</td>
                    <td className="p-3" dir="ltr">
                      {supplier.phone}
                    </td>
                    <td className="p-3 space-x-4">
                      <button
                        onClick={() => handleOpenModal(supplier)}
                        className="text-admin-primary hover:underline"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(supplier)}
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

      {isModalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      <ConfirmationModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف المورد "${supplierToDelete?.name}"؟`}
        isDestructive
      />
    </div>
  );
};

export default AdminSuppliersScreen;
