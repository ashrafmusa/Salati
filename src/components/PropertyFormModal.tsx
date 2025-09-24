import React, { useState, useEffect } from "react";
import {
  Property,
  Listing,
  PropertyType,
  ListingType,
  PricePeriod,
  ListingStatus,
} from "../types";
import { uploadToCloudinary, getOptimizedImageUrl } from "../utils/helpers";
import { SpinnerIcon, TrashIcon } from "../assets/icons";
import { PhotoIcon } from "../assets/adminIcons";
import { useToast } from "../contexts/ToastContext";
import { db } from "../firebase/config";

interface PropertyFormModalProps {
  property?: Property | null;
  onClose: () => void;
  onSave: (
    propertyData: Omit<Property, "id">,
    listingData: Omit<Listing, "id" | "propertyId">
  ) => void;
  isSaving: boolean;
}

const ALL_AMENITIES = [
  "مكيف",
  "واي فاي",
  "موقف سيارات",
  "مطبخ مجهز",
  "غسالة",
  "شرفة",
  "أمن",
  "مولد كهربائي",
];

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  property,
  onClose,
  onSave,
  isSaving,
}) => {
  const { showToast } = useToast();
  const [propData, setPropData] = useState<Partial<Property>>({});
  const [listData, setListData] = useState<
    Partial<Omit<Listing, "id" | "propertyId">>
  >({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchListing = async (propertyId: string) => {
      const listingQuery = await db
        .collection("listings")
        .where("propertyId", "==", propertyId)
        .limit(1)
        .get();
      if (!listingQuery.empty) {
        const listing = listingQuery.docs[0].data() as Listing;
        setListData(listing);
      }
    };

    if (property) {
      setPropData(property);
      fetchListing(property.id);
    } else {
      setPropData({
        title: "",
        description: "",
        type: "apartment",
        location: { address: "", city: "" },
        imageUrls: [],
        amenities: [],
        bedrooms: 1,
        bathrooms: 1,
        area: 50,
      });
      setListData({
        listingType: "rent",
        price: 0,
        status: ListingStatus.Available,
        pricePeriod: "monthly",
        listedDate: new Date().toISOString(),
      });
    }
  }, [property]);

  const handlePropChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "city" || name === "address") {
      setPropData((p) => ({
        ...p,
        location: { ...p.location, [name]: value } as any,
      }));
    } else if (["bedrooms", "bathrooms", "area"].includes(name)) {
      setPropData((p) => ({ ...p, [name]: Number(value) }));
    } else {
      setPropData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleListChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValues = {
      ...listData,
      [name]: name === "price" ? Number(value) : value,
    };
    if (name === "listingType" && value === "sale") {
      delete newValues.pricePeriod;
    } else if (name === "listingType" && value === "rent") {
      newValues.pricePeriod = "monthly";
    }
    setListData(newValues);
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = propData.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    setPropData((p) => ({ ...p, amenities: newAmenities }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map((file) => uploadToCloudinary(file))
      );
      setPropData((p) => ({
        ...p,
        imageUrls: [...(p.imageUrls || []), ...uploadedUrls],
      }));
    } catch (error) {
      showToast("Image upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    setPropData((p) => ({
      ...p,
      imageUrls: (p.imageUrls || []).filter((img) => img !== url),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propData.title || (propData.imageUrls || []).length === 0) {
      showToast("Title and at least one image are required.", "error");
      return;
    }
    onSave(
      propData as Omit<Property, "id">,
      listData as Omit<Listing, "id" | "propertyId">
    );
  };

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-admin-primary focus:border-admin-primary";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      >
        <h2 className="text-2xl font-bold mb-4 flex-shrink-0">
          {property ? "تعديل عقار" : "إضافة عقار جديد"}
        </h2>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6">
          {/* Basic Info */}
          <input
            name="title"
            value={propData.title || ""}
            onChange={handlePropChange}
            placeholder="عنوان العقار"
            className={inputClasses}
            required
          />
          <textarea
            name="description"
            value={propData.description || ""}
            onChange={handlePropChange}
            placeholder="الوصف"
            rows={4}
            className={inputClasses}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              name="type"
              value={propData.type}
              onChange={handlePropChange}
              className={inputClasses}
            >
              {["apartment", "house", "office", "land"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              name="city"
              value={propData.location?.city || ""}
              onChange={handlePropChange}
              placeholder="المدينة"
              className={inputClasses}
            />
            <input
              name="address"
              value={propData.location?.address || ""}
              onChange={handlePropChange}
              placeholder="العنوان"
              className={inputClasses}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input
              name="bedrooms"
              type="number"
              value={propData.bedrooms}
              onChange={handlePropChange}
              placeholder="غرف نوم"
              className={inputClasses}
            />
            <input
              name="bathrooms"
              type="number"
              value={propData.bathrooms}
              onChange={handlePropChange}
              placeholder="حمامات"
              className={inputClasses}
            />
            <input
              name="area"
              type="number"
              value={propData.area}
              onChange={handlePropChange}
              placeholder="المساحة (م²)"
              className={inputClasses}
            />
          </div>
          {/* Listing Info */}
          <fieldset className="p-4 border dark:border-slate-600 rounded-md">
            <legend className="px-2 font-semibold">تفاصيل القائمة</legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select
                name="listingType"
                value={listData.listingType}
                onChange={handleListChange}
                className={inputClasses}
              >
                <option value="rent">إيجار</option>
                <option value="sale">بيع</option>
              </select>
              <input
                name="price"
                type="number"
                value={listData.price}
                onChange={handleListChange}
                placeholder="السعر"
                className={inputClasses}
              />
              {listData.listingType === "rent" && (
                <select
                  name="pricePeriod"
                  value={listData.pricePeriod}
                  onChange={handleListChange}
                  className={inputClasses}
                >
                  <option value="monthly">شهري</option>
                  <option value="annually">سنوي</option>
                </select>
              )}
              <select
                name="status"
                value={listData.status}
                onChange={handleListChange}
                className={inputClasses}
              >
                {Object.values(ListingStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
          {/* Amenities */}
          <div>
            <h4 className="font-semibold mb-2">المرافق</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_AMENITIES.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={(propData.amenities || []).includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Image Uploader */}
          <div>
            <h4 className="font-semibold mb-2">الصور</h4>
            <div className="flex flex-wrap gap-4">
              {(propData.imageUrls || []).map((url) => (
                <div key={url} className="relative group">
                  <img
                    src={getOptimizedImageUrl(url, 200)}
                    alt="Property"
                    className="w-24 h-24 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(url)}
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                {isUploading ? (
                  <SpinnerIcon className="w-6 h-6 animate-spin" />
                ) : (
                  <PhotoIcon className="w-8 h-8 text-slate-400" />
                )}
                <input
                  type="file"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-600 rounded-md"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="px-6 py-2 bg-admin-primary text-white rounded-md w-32 flex justify-center"
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
  );
};
export default PropertyFormModal;
