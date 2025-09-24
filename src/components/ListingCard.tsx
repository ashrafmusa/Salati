import React from "react";
import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "../utils/helpers";
import { Property, Listing } from "../types"; // Assuming updated types with Arabic fields
import {
  BedIcon,
  UsersIcon,
  Squares2x2Icon,
  LocationMarkerIcon,
} from "../assets/icons";

// Assuming these are the types with Arabic fields (as you updated them previously)
// If your types file is NOT updated, you'll need to update it first!
interface PropertyWithArabic extends Property {
  arabicTitle: string;
}
interface ListingWithArabic extends Listing {
  propertyArabicTitle: string;
}

// Combined type for convenience
export type FullListing = ListingWithArabic & {
  property: PropertyWithArabic;
};

const ListingCard: React.FC<{ listing: FullListing }> = ({ listing }) => {
  const { property } = listing;

  // 1. Logic for Price Label in Arabic (using Arabic PricePeriod enums)
  const getPriceLabel = () => {
    // Note: Assuming 'ج.س' is the Sudanese Pound or a localized currency name
    let label = `${listing.price.toLocaleString()} ج.س`;
    if (listing.listingType === "Rent") {
      // Using 'Rent' key from enum
      const periodLabel =
        listing.pricePeriod === "Monthly" ? "شهرياً" : "سنوياً";
      label += ` / ${periodLabel}`;
    }
    return label;
  };

  // 2. Logic for Listing Type Label in Arabic
  const getListingTypeLabel = () => {
    return listing.listingType === "Rent" ? "للإيجار" : "للبيع";
  };

  // Helper to determine the text direction class
  // You should apply a `dir="rtl"` attribute or a CSS class (`rtl`) globally for Arabic.
  const isArabicMode = true; // Hardcoded for this file, but should come from context

  return (
    <Link
      to={`/property/${property.id}`}
      // Apply RTL and text direction classes for Arabic.
      // Assuming a Tailwind class 'rtl' sets direction: rtl;
      className={`block bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden group transition-all duration-300 transform hover:-translate-y-1.5 active:translate-y-0 hover:shadow-lg border dark:border-slate-700 ${
        isArabicMode ? "rtl text-right" : "ltr text-left"
      }`}
    >
      <div className="relative overflow-hidden">
        <img
          src={getOptimizedImageUrl(listing.imageUrl, 400)}
          alt={listing.propertyArabicTitle} // Use Arabic title for alt text
          className="w-full h-48 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
        {/* 3. Translate Listing Type Tag and adjust positioning for RTL */}
        <div
          className={`absolute top-3 ${
            isArabicMode ? "right-3 left-auto" : "left-3 right-auto"
          } bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}
        >
          {getListingTypeLabel()}
        </div>
      </div>
      <div className="p-4">
        {/* 4. Use Arabic Property Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
          {listing.propertyArabicTitle || listing.propertyTitle}{" "}
          {/* Fallback */}
        </h3>
        {/* 5. Address (Text direction is handled by the main Link tag) */}
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
          <LocationMarkerIcon className="w-4 h-4" />
          {property.location.city}, {property.location.address}
        </p>
        {/* 6. Price Label (Handled by getPriceLabel) */}
        <p className="text-xl font-bold text-secondary mt-3">
          {getPriceLabel()}
        </p>
        {/* 7. Amenities section: ensure proper spacing/order in RTL */}
        <div className="mt-4 pt-3 border-t dark:border-slate-700 flex justify-around text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <BedIcon className="w-5 h-5 text-primary" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span>{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-2">
            <Squares2x2Icon className="w-5 h-5 text-primary" />
            {/* 8. Translate Area Unit */}
            <span>{property.area} م²</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
