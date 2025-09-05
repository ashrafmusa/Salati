import React, { useState, useMemo, useEffect } from "react";
import { StoreProduct, Review, Category, Item, Bundle } from "../types";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import StoreProductCard from "../components/ProductCard";
import PromotionalBanner from "../components/PromotionalBanner";
import FilterSidebar, { Filters } from "../components/FilterSidebar";
import SectionHeader from "../components/SectionHeader";
import ScrollToTopButton from "../components/ScrollToTopButton";
import EmptyState from "../components/EmptyState";
import { getOptimizedImageUrl, calculateBundlePrice } from "../utils/helpers";
import HomeScreenSkeleton from "../components/HomeScreenSkeleton";
import SiteHeader from "../components/SiteHeader";

const HomeScreen: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("الكل");
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
    const unsubscribers = [
      onSnapshot(collection(db, "items"), (snapshot) => {
        setItems(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Item))
        );
      }),
      onSnapshot(collection(db, "bundles"), (snapshot) => {
        setBundles(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Bundle))
        );
      }),
      onSnapshot(collection(db, "reviews"), (snapshot) => {
        setReviews(snapshot.docs.map((doc) => doc.data() as Review));
      }),
      onSnapshot(
        query(collection(db, "categories"), orderBy("sortOrder")),
        (snapshot) => {
          setCategories(
            snapshot.docs.map(
              (doc) => ({ id: doc.id, ...doc.data() } as Category)
            )
          );
        }
      ),
    ];

    const initialLoad = async () => {
      await Promise.all([
        getDocs(collection(db, "items")),
        getDocs(collection(db, "bundles")),
        getDocs(collection(db, "categories")),
      ]);
      setLoading(false);
    };
    initialLoad().catch(() => setLoading(false));

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

    return allProducts.map((product) => {
      const ratingData = ratingsMap.get(product.id);
      return ratingData
        ? {
            ...product,
            averageRating: ratingData.total / ratingData.count,
            reviewCount: ratingData.count,
          }
        : product;
    });
  }, [allProducts, reviews]);

  const topRatedProducts = useMemo(() => {
    return [...productsWithRatings]
      .filter((p) => p.averageRating && p.averageRating >= 4)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 8);
  }, [productsWithRatings]);

  const filteredProducts = useMemo(() => {
    return productsWithRatings.filter((product) => {
      const matchesCategory =
        selectedCategory === "الكل" || product.category === selectedCategory;
      const productPrice = productPrices.get(product.id) || 0;
      const matchesPrice =
        productPrice >= activeFilters.priceRange.min &&
        productPrice <= activeFilters.priceRange.max;
      const matchesRating =
        activeFilters.rating === 0 ||
        (product.averageRating || 0) >= activeFilters.rating;
      return matchesCategory && matchesPrice && matchesRating;
    });
  }, [selectedCategory, productsWithRatings, activeFilters, productPrices]);

  const areFiltersActive = useMemo(() => {
    return (
      activeFilters.priceRange.min > 0 ||
      activeFilters.priceRange.max < maxPrice ||
      activeFilters.rating > 0
    );
  }, [activeFilters, maxPrice]);

  const handleResetFilters = () => {
    setActiveFilters({ priceRange: { min: 0, max: maxPrice }, rating: 0 });
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  const noProductsAvailable = !loading && allProducts.length === 0;
  const noResults =
    !loading && !noProductsAvailable && filteredProducts.length === 0;

  return (
    <>
      <SiteHeader
        onFilterClick={() => setIsFilterOpen(true)}
        areFiltersActive={areFiltersActive}
      />

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        <PromotionalBanner />

        <section>
          <SectionHeader title="تسوق حسب الفئة" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories
              .filter(
                (category) =>
                  category.image && typeof category.image === "string"
              )
              .map((category) => (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className="group relative rounded-xl overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <img
                    src={getOptimizedImageUrl(category.image, 400)}
                    alt={category.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                  <h3
                    className="absolute bottom-4 right-4 text-white text-lg font-bold"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
                  >
                    {category.name}
                  </h3>
                </div>
              ))}
          </div>
        </section>

        {topRatedProducts.length > 0 && (
          <section>
            <SectionHeader title="الأكثر تقييماً" />
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
              {topRatedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="w-64 sm:w-72 flex-shrink-0 animate-stagger-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <StoreProductCard
                    product={product}
                    price={productPrices.get(product.id) || 0}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader title="جميع المنتجات" />
          {noProductsAvailable ? (
            <EmptyState message="لا توجد منتجات متاحة في المتجر حالياً." />
          ) : noResults ? (
            <EmptyState
              message="لا توجد منتجات تطابق بحثك"
              onResetFilters={handleResetFilters}
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
                    onboardingId={
                      index === 0
                        ? `onboarding-add-to-cart-${product.id}`
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ScrollToTopButton />
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

// FIX: Added default export to fix lazy loading issue.
export default HomeScreen;
