import React, { useState, useMemo } from "react";
import { db } from "../firebase/config";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import AdminScreenHeader from "../components/AdminScreenHeader";
import AdminEmptyState from "../components/AdminEmptyState";
import { BuildingLibraryIcon } from "../assets/adminIcons";
import { useToast } from "../contexts/ToastContext";
import { usePaginatedFirestore } from "../hooks/usePaginatedFirestore";
import { Property, Listing, PropertyType } from "../types"; // Import PropertyType enum
import TableSkeleton from "../components/TableSkeleton";
import PropertyFormModal from "../components/PropertyFormModal";
import ConfirmationModal from "../components/ConfirmationModal";
import { useAuth } from "../hooks/useAuth";
import { logAdminAction } from "../utils/auditLogger";
import Pagination from "../components/Pagination";
import { getOptimizedImageUrl } from "../utils/helpers";

// Helper function to map English PropertyType key to Arabic display value
const getArabicPropertyType = (typeKey: keyof typeof PropertyType): string => {
  // Assuming PropertyType enum is defined as:
  // export enum PropertyType { Apartment = 'شقة', House = 'منزل/فيلا', Office = 'مكتب', Land = 'أرض' }
  // We can safely use the key to get the Arabic value.
  const arabicValue = PropertyType[typeKey];
  return arabicValue || typeKey; // Fallback to English key if not found
};

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

      // Assuming propertyData now includes 'arabicTitle', 'arabicDescription', etc.
      // from the PropertyFormModal.

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
            // 🌟 Use arabicTitle for localization, assuming the Listing interface was updated
            propertyArabicTitle:
              (propertyData as any).arabicTitle || propertyData.title,
            imageUrl: propertyData.imageUrls[0] || "",
          });
        } else {
          // This case is unlikely but good to handle
          const newListingRef = db.collection("listings").doc();
          batch.set(newListingRef, {
            ...listingData,
            propertyId: editingProperty.id,
            propertyTitle: propertyData.title,
            // 🌟 Use arabicTitle for localization, assuming the Listing interface was updated
            propertyArabicTitle:
              (propertyData as any).arabicTitle || propertyData.title,
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
          // 🌟 Use arabicTitle for localization
          propertyArabicTitle:
            (newProperty as any).arabicTitle || newProperty.title,
          imageUrl: newProperty.imageUrls[0] || "",
        };
        batch.set(listingRef, newListing);
      }

      await batch.commit();
      await logAdminAction(
        adminUser,
        editingProperty ? "Updated Property" : "Created Property",
        // 🌟 Use Arabic title in log description
        `Title: ${(propertyData as any).arabicTitle || propertyData.title}`
      );
      showToast(
        editingProperty ? "تم تحديث العقار بنجاح!" : "تم إنشاء العقار بنجاح!", // 🌟 Translated toast messages
        "success"
      );
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving property:", error);
      showToast("فشل حفظ العقار.", "error"); // 🌟 Translated toast message
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
        // 🌟 Use Arabic title in log description
        `Title: ${
          (propertyToDelete as any).arabicTitle || propertyToDelete.title
        }`
      );
      showToast("تم حذف العقار بنجاح.", "success"); // 🌟 Translated toast message
    } catch (error) {
      console.error("Error deleting property:", error);
      showToast("فشل حذف العقار.", "error"); // 🌟 Translated toast message
    } finally {
      setIsSaving(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <>
      {/* 🌟 Apply RTL to the main container */}
      <div className="h-full flex flex-col bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md rtl text-right">
        {/* AdminScreenHeader translations are already in place */}
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
              {/* 🌟 Apply text-right for the whole table */}
              <table className="w-full text-right">
                <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                  <tr>
                    {/* 🌟 Table Headers are already translated */}
                    <th className="p-3 font-semibold">العقار</th>
                    <th className="p-3 font-semibold">النوع</th>
                    <th className="p-3 font-semibold">المدينة</th>
                    <th className="p-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr
                      key={prop.id}
                      className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="p-3">
                        {/* 🌟 Change `flex items-center gap-3` for RTL by using 'flex-row-reverse' or adjusting the gap utility if your framework supports it globally */}
                        <div className="flex items-center gap-3">
                          <img
                            src={getOptimizedImageUrl(
                              prop.imageUrls[0] || "",
                              100
                            )}
                            // 🌟 Use Arabic title for alt text
                            alt={(prop as any).arabicTitle || prop.title}
                            className="w-16 h-12 rounded object-cover"
                          />
                          {/* 🌟 Use Arabic Title for display */}
                          <span className="font-medium">
                            {(prop as any).arabicTitle || prop.title}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {/* 🌟 Map type key to Arabic value */}
                        {getArabicPropertyType(
                          prop.type as keyof typeof PropertyType
                        )}
                      </td>
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
            // EmptyState translations are already in place
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
        title="تأكيد الحذف" // 🌟 Title is translated
        // 🌟 Use Arabic title and translate the message
        message={`هل أنت متأكد من حذف العقار "${
          (propertyToDelete as any)?.arabicTitle || propertyToDelete?.title
        }"؟ سيتم حذف القائمة المرتبطة به أيضاً.`}
        confirmText="نعم، احذف" // 🌟 Button text is translated
        isDestructive
      />
    </>
  );
};

export default AdminPropertiesScreen;
