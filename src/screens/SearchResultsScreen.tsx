import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Product, Review } from "../types";
import { db } from "../firebase/config";
import ProductCard from "../components/ProductCard";
import FilterSidebar, { Filters } from "../components/FilterSidebar";
import EmptyState from "../components/EmptyState";
import { calculateProductTotal } from "../utils/helpers";
import SiteHeader from "../components/SiteHeader";
import HomeScreenSkeleton from "../components/HomeScreenSkeleton";

const SearchResultsScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    const prices = products.map((p) => calculateProductTotal(p));
    return Math.ceil(Math.max(...prices) / 1000) * 1000;
  }, [products]);

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
    const unsubscribeProducts = db
      .collection("products")
      .onSnapshot((snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product))
        );
        setLoading(false);
      });
    const unsubscribeReviews = db
      .collection("reviews")
      .onSnapshot((snapshot) => {
        setReviews(snapshot.docs.map((doc) => doc.data() as Review));
      });

    return () => {
      unsubscribeProducts();
      unsubscribeReviews();
    };
  }, []);

  const productsWithRatings = useMemo(() => {
    if (reviews.length === 0) return products;
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
    return products.map((p) => {
      const ratingData = ratingsMap.get(p.id);
      return ratingData
        ? {
            ...p,
            averageRating: ratingData.total / ratingData.count,
            reviewCount: ratingData.count,
          }
        : p;
    });
  }, [products, reviews]);

  const filteredProducts = useMemo(() => {
    return productsWithRatings.filter((product) => {
      const lowerCaseQuery = query.toLowerCase();
      const matchesSearch =
        product.arabicName.toLowerCase().includes(lowerCaseQuery) ||
        product.name.toLowerCase().includes(lowerCaseQuery);
      const productPrice = calculateProductTotal(product);
      const matchesPrice =
        productPrice >= activeFilters.priceRange.min &&
        productPrice <= activeFilters.priceRange.max;
      const matchesRating =
        activeFilters.rating === 0 ||
        (product.averageRating || 0) >= activeFilters.rating;
      return matchesSearch && matchesPrice && matchesRating;
    });
  }, [query, productsWithRatings, activeFilters]);

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
      <SiteHeader
        onFilterClick={() => setIsFilterOpen(true)}
        areFiltersActive={areFiltersActive}
      />
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
            {filteredProducts.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
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
