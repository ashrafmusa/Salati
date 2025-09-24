import React, { useState, useEffect, useMemo } from "react";
import SubPageHeader from "../components/SubPageHeader";
import MetaTagManager from "../components/MetaTagManager";
import { db } from "../firebase/config";
import {
  Listing,
  Property,
  ListingStatus,
  PropertyType,
  ListingType,
} from "../types";
import ListingCard, { FullListing } from "../components/ListingCard";
import EmptyState from "../components/EmptyState";
import ProductCardSkeleton from "../components/ProductCardSkeleton";

// Helper function to map English PropertyType key to Arabic display value
const getArabicPropertyType = (typeKey: keyof typeof PropertyType): string => {
  // Assuming PropertyType enum is imported from "../types"
  return PropertyType[typeKey] || typeKey;
};

// Helper function to map English ListingType key to Arabic display value
const getArabicListingType = (typeKey: keyof typeof ListingType): string => {
  // Assuming ListingType enum is imported from "../types"
  return ListingType[typeKey] || typeKey;
};

const RealEstateScreen: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state uses English keys for consistent logic across all languages.
  const [filters, setFilters] = useState({
    listingType: "all" as keyof typeof ListingType | "all",
    propertyType: "all" as keyof typeof PropertyType | "all",
    city: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const listingsQuery = db
          .collection("listings")
          // Queries Firestore by the Arabic enum value ("متاح")
          .where("status", "==", ListingStatus.Available);
        const propertiesQuery = db.collection("properties");

        const [listingsSnap, propertiesSnap] = await Promise.all([
          listingsQuery.get(),
          propertiesQuery.get(),
        ]);

        setListings(
          listingsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Listing)
          )
        );
        setProperties(
          propertiesSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Property)
          )
        );
      } catch (error) {
        console.error("Error fetching real estate data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fullListings = useMemo<FullListing[]>(() => {
    const propertyMap = new Map(properties.map((p) => [p.id, p]));
    return listings
      .map((listing) => {
        const property = propertyMap.get(listing.propertyId);
        return property ? { ...listing, property } : null;
      })
      .filter((l): l is FullListing => l !== null);
  }, [listings, properties]);

  const cities = useMemo(
    () => [...new Set(properties.map((p) => p.location.city).filter(Boolean))],
    [properties]
  );

  const filteredListings = useMemo(() => {
    return fullListings.filter((l) => {
      const matchesListingType =
        filters.listingType === "all" || l.listingType === filters.listingType;
      const matchesPropertyType =
        filters.propertyType === "all" ||
        l.property.type === filters.propertyType;
      const matchesCity =
        !filters.city || l.property.location.city === filters.city;
      return matchesListingType && matchesPropertyType && matchesCity;
    });
  }, [filters, fullListings]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const inputClasses =
    "w-full p-2 border rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary";

  return (
    // RTL class applies right-to-left layout and text-right alignment globally
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen rtl text-right">
      <MetaTagManager
        title="العقارات - سـلـتـي"
        description="تصفح أفضل العقارات والشقق للإيجار والبيع في السودان عبر منصة سـلـتـي."
      />
      <SubPageHeader title="العقارات" backPath="/" />

      {/* Filters */}
      <div className="p-4 bg-white dark:bg-slate-800/50 sticky top-[56px] z-10 border-b dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Listing Type Filter: Uses English keys but displays Arabic values */}
          <select
            name="listingType"
            value={filters.listingType}
            onChange={handleFilterChange}
            className={inputClasses}
          >
            <option value="all">الكل (بيع/إيجار)</option>
            <option value="Sale">{getArabicListingType("Sale")}</option>
            <option value="Rent">{getArabicListingType("Rent")}</option>
          </select>
          {/* Property Type Filter: Uses English keys but displays Arabic values */}
          <select
            name="propertyType"
            value={filters.propertyType}
            onChange={handleFilterChange}
            className={inputClasses}
          >
            <option value="all">كل أنواع العقارات</option>
            <option value="Apartment">
              {getArabicPropertyType("Apartment")}
            </option>
            <option value="House">{getArabicPropertyType("House")}</option>
            <option value="Office">{getArabicPropertyType("Office")}</option>
            <option value="Land">{getArabicPropertyType("Land")}</option>
          </select>
          {/* City Filter: Note: City names themselves will appear in the language they are stored in Firestore */}
          <select
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            className={`${inputClasses} col-span-2 md:col-span-1`}
          >
            <option value="">كل المدن</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              // ListingCard component must handle Arabic titles and RTL internally
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState message="لا توجد عقارات تطابق بحثك." />
        )}
      </div>
    </div>
  );
};

export default RealEstateScreen;
