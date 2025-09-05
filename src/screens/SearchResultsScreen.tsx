import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { StoreProduct, Review, Item, Bundle, Category } from "../types";
import { db } from "../firebase/config";
import StoreProductCard from "../components/ProductCard";
import FilterSidebar, { Filters } from "../components/FilterSidebar";
import EmptyState from "../components/EmptyState";
import { calculateBundlePrice } from "../utils/helpers";
import HomeScreenSkeleton from "../components/HomeScreenSkeleton";
import SiteHeader from "../components/SiteHeader";
import SubPageHeader from "../components/SubPageHeader";

const SearchResultsScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [items, setItems] = useState<Item[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const allProducts: StoreProduct[] = useMemo(
    () => [...items, ...bundles],
    [items, bundles]
  );

  const productPrices = useMemo(() => {
    const priceMap = new Map<string, number>();
    allProducts.forEach((p) => {
      if (p.type === "item") {
        priceMap.set(p.id, p.price);
      } else {
        priceMap.set(p.id, calculateBundlePrice(p, items));
      }
    });
    return priceMap;
  }, [allProducts, items]);

  const maxPrice = useMemo(() => {
    if (allProducts.length === 0) return 10000;
    const prices = Array.from(productPrices.values());
    return Math.ceil(Math.max(...prices) / 1000) * 1000;
  }, [allProducts, productPrices]);

  const [activeFilters, setActiveFilters] = useState<Filters>({
    priceRange: { min: 0, max: maxPrice },
    rating: 0,
  });

  useEffect(() => {
    setActiveFilters((prev) => ({
      ...prev,
      priceRange: { min: 0, max: maxPrice },
    }));
  }, [maxPrice]);

  useEffect(() => {
    setLoading(true);
    const unsubscribers = [
      db.collection("items").onSnapshot((snapshot) => {
        setItems(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
        );
      }),
      db.collection("bundles").onSnapshot((snapshot) => {
        setBundles(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Bundle))
        );
      }),
      db.collection("reviews").onSnapshot((snapshot) => {
        setReviews(snapshot.docs.map((doc) => doc.data() as Review));
      }),
    ];

    Promise.all([
      db.collection("items").get(),
      db.collection("bundles").get(),
    ]).then(() => {
      setLoading(false);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  const productsWithRatings = useMemo(() => {
    const ratingsMap = new Map<string, { total: number; count: number }>();
    reviews.forEach((review) => {
      const existing = ratingsMap.get(review.productId) || {
        total: 0,
        count: 0,
      };
      ratingsMap.set(review.productId, {
        total: existing.total + review.rating,
        count: existing.count + 1,
      });
    });
    return allProducts.map((p) => {
      const ratingData = ratingsMap.get(p.id);
      return ratingData
        ? {
            ...p,
            averageRating: ratingData.total / ratingData.count,
            reviewCount: ratingData.count,
          }
        : p;
    });
  }, [allProducts, reviews]);

  const filteredProducts = useMemo(() => {
    return productsWithRatings.filter((product) => {
      const lowerCaseQuery = query.toLowerCase();
      const matchesSearch =
        product.arabicName.toLowerCase().includes(lowerCaseQuery) ||
        product.name.toLowerCase().includes(lowerCaseQuery);
      const productPrice = productPrices.get(product.id) || 0;
      const matchesPrice =
        productPrice >= activeFilters.priceRange.min &&
        productPrice <= activeFilters.priceRange.max;
      const matchesRating =
        activeFilters.rating === 0 ||
        (product.averageRating || 0) >= activeFilters.rating;
      return matchesSearch && matchesPrice && matchesRating;
    });
  }, [query, productsWithRatings, activeFilters, productPrices]);

  const areFiltersActive = useMemo(() => {
    return (
      activeFilters.priceRange.min > 0 ||
      activeFilters.priceRange.max < maxPrice ||
      activeFilters.rating > 0
    );
  }, [activeFilters, maxPrice]);

  const handleResetFilters = () => {
    setActiveFilters({
      priceRange: { min: 0, max: maxPrice },
      rating: 0,
    });
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <>
      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            نتائج البحث عن: <span className="text-primary">'{query}'</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredProducts.length} منتجات تم العثور عليها
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            message="لم يتم العثور على منتجات تطابق بحثك"
            onResetFilters={areFiltersActive ? handleResetFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-stagger-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StoreProductCard
                  product={product}
                  price={productPrices.get(product.id) || 0}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <FilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={setActiveFilters}
        initialFilters={activeFilters}
        maxPrice={maxPrice}
      />
    </>
  );
};

export default SearchResultsScreen;
