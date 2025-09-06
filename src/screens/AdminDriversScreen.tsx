import React, { useState, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Driver } from "../types";
import { PlusIcon, TruckIcon } from "../assets/adminIcons";
import DriverFormModal from "../components/DriverFormModal";
import { useToast } from "../contexts/ToastContext";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import SortableHeader from "../components/SortableHeader";
import Pagination from "../components/Pagination";

const AdminDriversScreen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const initialSort = useMemo(
    () => ({ key: "name" as const, direction: "ascending" as const }),
    []
  );

  const {
    documents: drivers,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    requestSort,
    sortConfig,
  } = usePaginatedFirestore<Driver>("drivers", initialSort);

  const handleOpenModal = (driver?: Driver) => {
    setEditingDriver(driver || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  };

  const handleSaveDriver = async (driverToSave: Driver) => {
    setIsSaving(true);
    const { id, ...driverData } = driverToSave;
    try {
      if (editingDriver) {
        await updateDoc(doc(db, "drivers", id), driverData);
        showToast("Driver details updated successfully!", "success");
      } else {
        await addDoc(collection(db, "drivers"), driverData);
        showToast("New driver added successfully!", "success");
      }
    } catch (error) {
      console.error("Error saving driver:", error);
      showToast("Failed to save driver details.", "error");
    }
    setIsSaving(false);
    handleCloseModal();
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (
      window.confirm(`Are you sure you want to delete driver "${driverName}"?`)
    ) {
      try {
        await deleteDoc(doc(db, "drivers", driverId));
        showToast(`Driver "${driverName}" has been deleted.`, "success");
      } catch (error) {
        console.error("Error deleting driver:", error);
        showToast("Failed to delete driver.", "error");
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          قائمة السائقين
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95 shadow-sm"
        >
          <PlusIcon className="w-5 h-5 ml-2" />
          إضافة سائق
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <p>جار تحميل السائقين...</p>
        ) : drivers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-right">
                <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                  <tr>
                    <SortableHeader<Driver>
                      label="اسم السائق"
                      sortKey="name"
                      requestSort={requestSort}
                      sortConfig={sortConfig}
                    />
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      رقم الهاتف
                    </th>
                    <SortableHeader<Driver>
                      label="الحالة"
                      sortKey="status"
                      requestSort={requestSort}
                      sortConfig={sortConfig}
                    />
                    <th className="p-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      إجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver, index) => (
                    <tr
                      key={driver.id}
                      className={`border-b dark:border-slate-700 transition-colors ${
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-800"
                          : "bg-slate-50 dark:bg-slate-800/50"
                      } hover:bg-sky-100/50 dark:hover:bg-sky-900/20`}
                    >
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                        {driver.name}
                      </td>
                      <td
                        className="p-3 text-slate-600 dark:text-slate-300"
                        dir="ltr"
                      >
                        {driver.phone}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {driver.status}
                      </td>
                      <td className="p-3 space-x-4 space-x-reverse">
                        <button
                          onClick={() => handleOpenModal(driver)}
                          className="text-admin-primary hover:underline text-sm font-semibold"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteDriver(driver.id, driver.name)
                          }
                          className="text-red-500 hover:underline text-sm font-semibold"
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
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {driver.name}
                      </p>
                      <p
                        className="text-sm text-slate-500 dark:text-slate-400"
                        dir="ltr"
                      >
                        {driver.phone}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        driver.status === "Available"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : driver.status === "On-Delivery"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {driver.status}
                    </span>
                  </div>
                  <div className="flex justify-end gap-4 mt-4 pt-2 border-t dark:border-slate-600">
                    <button
                      onClick={() => handleOpenModal(driver)}
                      className="text-admin-primary font-semibold"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id, driver.name)}
                      className="text-red-500 font-semibold"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <TruckIcon className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-200">
              لا يوجد سائقون بعد
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              ابدأ ببناء أسطول التوصيل الخاص بك.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 flex items-center mx-auto bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-colors shadow-sm"
            >
              <PlusIcon className="w-5 h-5 ml-2" />
              إضافة سائق
            </button>
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
        <DriverFormModal
          driver={editingDriver}
          onClose={handleCloseModal}
          onSave={handleSaveDriver}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
export default AdminDriversScreen;
