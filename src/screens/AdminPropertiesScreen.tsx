import React, { useState, useMemo } from "react";
import { db } from "../firebase/config";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import AdminScreenHeader from "../components/AdminScreenHeader";
import AdminEmptyState from "../components/AdminEmptyState";
import { BuildingLibraryIcon } from "../assets/adminIcons";
import { useToast } from "../contexts/ToastContext";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import { Property, Listing } from "../types";
import TableSkeleton from "../components/TableSkeleton";
import PropertyFormModal from "../components/PropertyFormModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";
import Pagination from "../components/Pagination";
import { getOptimizedImageUrl } from "../utils/helpers";

const AdminPropertiesScreen: React.FC = () => {
  const { showToast } = useToast();
  const { user: adminUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const initialSort = useMemo(
    () => ({ key: "title" as const, direction: "ascending" as const }),
    []
  );
  const {
    documents: properties,
    loading,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedFirestore<Property>("properties", initialSort);

  const handleOpenModal = (property: Property | null = null) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleSaveProperty = async (
    propertyData: Property,
    listingData: Omit<Listing, "id" | "propertyId">
  ) => {
    setIsSaving(true);
    try {
      const batch = db.batch();

      if (editingProperty) {
        // UPDATE
        const propRef = db.collection("properties").doc(editingProperty.id);
        batch.update(propRef, propertyData);

        // Find and update associated listing
        const listingQuery = await db
          .collection("listings")
          .where("propertyId", "==", editingProperty.id)
          .limit(1)
          .get();
        if (!listingQuery.empty) {
          const listingRef = listingQuery.docs[0].ref;
          batch.update(listingRef, {
            ...listingData,
            propertyTitle: propertyData.title,
            imageUrl: propertyData.imageUrls[0] || "",
          });
        } else {
          // This case is unlikely but good to handle
          const newListingRef = db.collection("listings").doc();
          batch.set(newListingRef, {
            ...listingData,
            propertyId: editingProperty.id,
            propertyTitle: propertyData.title,
            imageUrl: propertyData.imageUrls[0] || "",
          });
        }
      } else {
        // CREATE
        const propRef = db.collection("properties").doc();
        const newProperty = { ...propertyData, id: propRef.id };
        batch.set(propRef, newProperty);

        const listingRef = db.collection("listings").doc();
        const newListing = {
          ...listingData,
          id: listingRef.id,
          propertyId: propRef.id,
          propertyTitle: newProperty.title,
          imageUrl: newProperty.imageUrls[0] || "",
        };
        batch.set(listingRef, newListing);
      }

      await batch.commit();
      await logAdminAction(
        adminUser,
        editingProperty ? "Updated Property" : "Created Property",
        `Title: ${propertyData.title}`
      );
      showToast(
        editingProperty ? "Property updated!" : "Property created!",
        "success"
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving property:", error);
      showToast("Failed to save property.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    setIsSaving(true);
    try {
      const batch = db.batch();
      const propRef = db.collection("properties").doc(propertyToDelete.id);
      batch.delete(propRef);

      const listingQuery = await db
        .collection("listings")
        .where("propertyId", "==", propertyToDelete.id)
        .get();
      listingQuery.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
      await logAdminAction(
        adminUser,
        "Deleted Property",
        `Title: ${propertyToDelete.title}`
      );
      showToast("Property deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting property:", error);
      showToast("Failed to delete property.", "error");
    } finally {
      setIsSaving(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <AdminScreenHeader
          title="إدارة العقارات"
          buttonText="إضافة عقار جديد"
          onButtonClick={() => handleOpenModal()}
        />
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <TableSkeleton />
          ) : properties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="p-3">العقار</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">المدينة</th>
                    <th className="p-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={getOptimizedImageUrl(
                              prop.imageUrls[0] || "",
                              100
                            )}
                            alt={prop.title}
                            className="w-16 h-12 rounded object-cover"
                          />
                          <span className="font-medium">{prop.title}</span>
                        </div>
                      </td>
                      <td className="p-3 capitalize">{prop.type}</td>
                      <td className="p-3">{prop.location.city}</td>
                      <td className="p-3 space-x-4 space-x-reverse">
                        <button
                          onClick={() => handleOpenModal(prop)}
                          className="text-admin-primary hover:underline"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setPropertyToDelete(prop)}
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
          ) : (
            <AdminEmptyState
              icon={BuildingLibraryIcon}
              title="لا توجد عقارات بعد"
              message="ابدأ بإضافة العقارات المتاحة لديك لإدارتها من هنا."
              buttonText="إضافة العقار الأول"
              onButtonClick={() => handleOpenModal()}
            />
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
        <PropertyFormModal
          property={editingProperty}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProperty}
          isSaving={isSaving}
        />
      )}

      <ConfirmationModal
        isOpen={!!propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={handleDeleteProperty}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف العقار "${propertyToDelete?.title}"؟ سيتم حذف القائمة المرتبطة به أيضاً.`}
        confirmText="نعم، احذف"
        isDestructive
      />
    </>
  );
};

export default AdminPropertiesScreen;
