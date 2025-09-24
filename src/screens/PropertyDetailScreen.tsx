import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase/config";
import {
  Property,
  Listing,
  ListingStatus,
  PricePeriod,
  ListingType,
} from "../types"; // Import necessary enums/types
import SubPageHeader from "../components/SubPageHeader";
import MetaTagManager from "../components/MetaTagManager";
import {
  SpinnerIcon,
  WhatsAppIcon,
  BedIcon,
  UsersIcon,
  Squares2x2Icon,
  LocationMarkerIcon,
  CheckCircleIcon,
} from "../assets/icons";
import ProductImageGallery from "../components/ProductImageGallery";

// Helper to get Arabic value for Listing Type (assuming ListingType enum exists)
const getArabicListingType = (typeKey: keyof typeof ListingType): string => {
  return ListingType[typeKey] || typeKey;
};

const PropertyDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true); // 🌟 Use environment variable for phone number

  const phoneNumber = (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const propRef = db.collection("properties").doc(id);
        const propDoc = await propRef.get();

        if (propDoc.exists) {
          const propData = { id: propDoc.id, ...propDoc.data() } as Property;
          setProperty(propData);

          const listingQuery = db
            .collection("listings")
            .where("propertyId", "==", id)
            .limit(1);
          const listingSnap = await listingQuery.get();
          if (!listingSnap.empty) {
            setListing({
              id: listingSnap.docs[0].id,
              ...listingSnap.docs[0].data(),
            } as Listing);
          }
        }
      } catch (error) {
        console.error("Error fetching property details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      // 🌟 Add RTL text alignment for spinner loading
      <div className="flex items-center justify-center h-screen rtl text-right">
                <SpinnerIcon className="w-12 h-12 text-primary animate-spin" /> 
           {" "}
      </div>
    );
  }

  if (!property || !listing) {
    return (
      <div className="rtl text-right">
        {" "}
        {/* 🌟 Add RTL to outer container */}
                <MetaTagManager title="العقار غير موجود - سـلـتـي" />
                <SubPageHeader title="خطأ" />       {" "}
        <div className="text-center p-8">
                   {" "}
          <h2 className="text-2xl font-bold mb-4">العقار غير موجود</h2>         {" "}
          <Link to="/real-estate" className="text-primary hover:underline">
                        العودة إلى قائمة العقارات          {" "}
          </Link>
                 {" "}
        </div>
             {" "}
      </div>
    );
  } // 🌟 Use Arabic property title in the WhatsApp message

  const arabicTitle = (property as any).arabicTitle || property.title;
  const whatsappMessage = encodeURIComponent(
    `مرحباً، أنا مهتم بالعقار "${arabicTitle}" الموجود على منصة سـلـتـي. هل يمكنني الحصول على مزيد من المعلومات؟`
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`; // 🌟 Update Price Label logic to use enum keys and Arabic periods

  const getPriceLabel = () => {
    let label = `${listing.price.toLocaleString()} ج.س`; // Use the 'Rent' key from the ListingType enum
    if (listing.listingType === "Rent") {
      const periodKey = listing.pricePeriod as keyof typeof PricePeriod; // Use the PricePeriod enum values for display
      const periodLabel = periodKey === "Annually" ? "سنوياً" : "شهرياً";
      label += ` / ${periodLabel}`;
    }
    return label;
  }; // 🌟 Use Arabic property data

  const arabicDescription =
    (property as any).arabicDescription || property.description;
  const arabicAmenities =
    (property as any).arabicAmenities || property.amenities;

  return (
    // 🌟 Apply RTL to the entire screen container
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen rtl text-right">
           {" "}
      <MetaTagManager // 🌟 Use Arabic property title for meta tags
        title={`${arabicTitle} - سـلـتـي`}
        description={arabicDescription.substring(0, 160)}
      />
            {/* 🌟 Use Arabic property title in the header */}
            <SubPageHeader title={arabicTitle} backPath="/real-estate" />     {" "}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-24">
               {" "}
        {/* 🌟 Swap grid columns for RTL: Details (Right) on the left, Image (Left) on the right */}
               {" "}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {" "}
          {/* Right Column (Details) - Now on the left in the grid, but content is right-aligned */}
                   {" "}
          <div className="lg:col-span-1 space-y-6 lg:order-2">
            {" "}
            {/* 🌟 Add lg:order-2 */}           {" "}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                           {" "}
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-2 ${
                  listing.listingType === "Rent" // 🌟 Use 'Rent' key
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                                {/* 🌟 Use Arabic Listing Type */}             
                 {" "}
                {getArabicListingType(
                  listing.listingType as keyof typeof ListingType
                )}
                             {" "}
              </span>
                           {" "}
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                                {arabicTitle} {/* 🌟 Use Arabic title */}       
                     {" "}
              </h1>
                           {" "}
              <p className="text-secondary text-4xl font-bold mt-4">
                                {getPriceLabel()}             {" "}
              </p>
                           {" "}
              {/* Location icon will naturally move to the right/start of the text in RTL */}
                           {" "}
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2">
                                <LocationMarkerIcon className="w-5 h-5" />     
                          {property.location.city}, {property.location.address} 
                           {" "}
              </p>
                         {" "}
            </div>
                       {" "}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                           {" "}
              <h2 className="text-xl font-bold mb-4">المواصفات</h2>{" "}
              {/* 🌟 Translated Header */}             {" "}
              <div className="grid grid-cols-3 gap-4 text-center">
                               {" "}
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                   {" "}
                  <BedIcon className="w-8 h-8 mx-auto text-primary" />         
                         {" "}
                  <p className="mt-1 font-semibold">{property.bedrooms}</p>     
                              <p className="text-xs text-slate-500">غرف نوم</p>{" "}
                  {/* 🌟 Translated label */}               {" "}
                </div>
                               {" "}
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                   {" "}
                  <UsersIcon className="w-8 h-8 mx-auto text-primary" />       
                           {" "}
                  <p className="mt-1 font-semibold">{property.bathrooms}</p>   
                                <p className="text-xs text-slate-500">حمامات</p>{" "}
                  {/* 🌟 Translated label */}               {" "}
                </div>
                               {" "}
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                                   {" "}
                  <Squares2x2Icon className="w-8 h-8 mx-auto text-primary" />   
                               {" "}
                  <p className="mt-1 font-semibold">
                                        {property.area}{" "}
                    <span className="text-xs">م²</span>{" "}
                    {/* 🌟 Translated unit */}                 {" "}
                  </p>
                                   {" "}
                  <p className="text-xs text-slate-500">المساحة</p>{" "}
                  {/* 🌟 Translated label */}               {" "}
                </div>
                             {" "}
              </div>
                         {" "}
            </div>
                       {" "}
            {phoneNumber && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-green-500 text-white font-bold rounded-lg text-lg hover:bg-green-600 transition-transform transform active:scale-95 shadow-lg"
              >
                                <WhatsAppIcon className="w-6 h-6" />           
                    تواصل للاستفسار {/* 🌟 Translated button text */}           
                 {" "}
              </a>
            )}
                     {" "}
          </div>
                   {" "}
          {/* Left Column (Image & Contact) - Now on the right in the grid */} 
                 {" "}
          <div className="lg:col-span-2 lg:order-1">
            {" "}
            {/* 🌟 Add lg:order-1 */}
                       {" "}
            <ProductImageGallery
              mainImage={property.imageUrls[0]}
              otherImages={property.imageUrls.slice(1)}
              altText={arabicTitle} // 🌟 Use Arabic title for alt text
            />
                     {" "}
          </div>
                 {" "}
        </div>
                {/* Description & Amenities below */}       {" "}
        <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4">الوصف</h2>{" "}
          {/* 🌟 Translated Header */}         {" "}
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {arabicDescription} {/* 🌟 Use Arabic description */}   
                 {" "}
          </p>
                 {" "}
        </div>
               {" "}
        {arabicAmenities.length > 0 && (
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border dark:border-slate-700">
                       {" "}
            <h2 className="text-xl font-bold mb-4">المرافق والمميزات</h2>{" "}
            {/* 🌟 Translated Header */}           {" "}
            {/* 🌟 Add RTL to grid layout */}           {" "}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                           {" "}
              {arabicAmenities.map((amenity: string) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded"
                >
                                   {" "}
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />       
                           {" "}
                  <span className="font-semibold text-sm">{amenity}</span>{" "}
                  {/* Amenity should be in Arabic */}               {" "}
                </div>
              ))}
                         {" "}
            </div>
                     {" "}
          </div>
        )}
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default PropertyDetailScreen;
