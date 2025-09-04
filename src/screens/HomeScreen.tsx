
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Review, Category } from '../types';
import { db } from '../firebase/config';
import ProductCard from '../components/ProductCard';
import PromotionalBanner from '../components/PromotionalBanner';
import FilterSidebar, { Filters } from '../components/FilterSidebar';
import SectionHeader from '../components/SectionHeader';
import ScrollToTopButton from '../components/ScrollToTopButton';
import EmptyState from '../components/EmptyState';
import { SearchIcon, FilterIcon } from '../assets/icons';
import { calculateProductTotal, getOptimizedImageUrl } from '../utils/helpers';
import Logo from '../components/Logo';
import HomeScreenSkeleton from '../components/HomeScreenSkeleton';

const HomeScreen: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    // FIX: Use separate loading states for each data source to ensure robustness.
    const [productsLoading, setProductsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    
    // UI State
    const [selectedCategory, setSelectedCategory] = useState("الكل");
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [headerScrolled, setHeaderScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setHeaderScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const maxPrice = useMemo(() => {
        if (products.length === 0) return 10000;
        const prices = products.map((product: Product) => calculateProductTotal(product));
        return Math.ceil(Math.max(...prices) / 1000) * 1000; // Round up to nearest 1000
    }, [products]);

    const [activeFilters, setActiveFilters] = useState<Filters>({
        priceRange: { min: 0, max: maxPrice },
        rating: 0,
    });
    
    useEffect(() => {
        setActiveFilters(prev => ({...prev, priceRange: { min: 0, max: maxPrice }}));
    }, [maxPrice]);


    useEffect(() => {
        const unsubscribeProducts = db.collection('products').onSnapshot(snapshot => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];
            setProducts(productsData);
            setProductsLoading(false);
        }, err => {
            console.error("Error fetching products:", err);
            setProductsLoading(false);
        });

        const unsubscribeReviews = db.collection('reviews').onSnapshot(snapshot => {
            const reviewsData = snapshot.docs.map(doc => doc.data() as Review);
            setReviews(reviewsData);
        });

        const unsubscribeCategories = db.collection('categories').orderBy('sortOrder').onSnapshot(snapshot => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setCategoriesLoading(false);
        }, err => {
            console.error("Error fetching categories:", err);
            setCategoriesLoading(false);
        });

        return () => {
            unsubscribeProducts();
            unsubscribeReviews();
            unsubscribeCategories();
        };
    }, []);

    const productsWithRatings = useMemo(() => {
        if (reviews.length === 0) return products;
        
        const ratingsMap = new Map<string, { total: number; count: number }>();
        reviews.forEach(review => {
            const existing = ratingsMap.get(review.productId) || { total: 0, count: 0 };
            ratingsMap.set(review.productId, {
                total: existing.total + review.rating,
                count: existing.count + 1,
            });
        });

        return products.map((product: Product) => {
            const ratingData = ratingsMap.get(product.id);
            if (ratingData) {
                return {
                    ...product,
                    averageRating: ratingData.total / ratingData.count,
                    reviewCount: ratingData.count,
                };
            }
            return product;
        });
    }, [products, reviews]);
    
    const topRatedProducts = useMemo(() => {
        return [...productsWithRatings]
            .filter(p => p.averageRating && p.averageRating >= 4)
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, 8);
    }, [productsWithRatings]);

    const filteredProducts = useMemo(() => {
        return productsWithRatings.filter((product: Product) => {
            const matchesCategory = selectedCategory === "الكل" || product.category === selectedCategory;
            const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (product.arabicName || '').includes(searchTerm);
            
            const productPrice = calculateProductTotal(product);
            const matchesPrice = productPrice >= activeFilters.priceRange.min && productPrice <= activeFilters.priceRange.max;
            
            const matchesRating = activeFilters.rating === 0 || ((product as any).averageRating || 0) >= activeFilters.rating;

            return matchesCategory && matchesSearch && matchesPrice && matchesRating;
        });
    }, [selectedCategory, searchTerm, productsWithRatings, activeFilters]);
    
    const areFiltersActive = useMemo(() => {
        return activeFilters.priceRange.min > 0 || activeFilters.priceRange.max < maxPrice || activeFilters.rating > 0;
    }, [activeFilters, maxPrice]);
    
    const handleResetFilters = () => {
        setSelectedCategory("الكل");
        setSearchTerm("");
        const resetFiltersState = {
            priceRange: { min: 0, max: maxPrice },
            rating: 0,
        };
        setActiveFilters(resetFiltersState);
    };
    
    const loading = productsLoading || categoriesLoading;
    
    // FIX: Improved empty state logic for better UX.
    const noProductsAvailable = !loading && products.length === 0;
    const noSearchResults = !loading && !noProductsAvailable && filteredProducts.length === 0;
    
    if (loading) {
        return <HomeScreenSkeleton />;
    }

    return (
        <>
            <header className={`sticky top-0 z-20 bg-warmBeige/80 dark:bg-slate-950/80 backdrop-blur-lg border-b dark:border-slate-800 transition-shadow duration-300 ${headerScrolled ? 'header-shadow' : ''}`}>
                <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center gap-4">
                    <Logo 
                        imgClassName="w-10 sm:w-12"
                        textClassName="hidden sm:block text-2xl"
                    />
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:border-transparent focus:outline-none transition-shadow"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="relative flex-shrink-0 p-2 rounded-full text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <FilterIcon className="w-5 h-5"/>
                        {areFiltersActive && <span className="absolute -top-1 -right-1 block w-3 h-3 bg-primary rounded-full border-2 border-warmBeige dark:border-slate-950"></span>}
                    </button>
                </div>
            </header>

            <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
                <PromotionalBanner />
                
                <section>
                    <SectionHeader title="تسوق حسب الفئة" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* FIX: Add defensive check to prevent crash from corrupt category data */}
                        {categories
                            .filter(category => category.image && typeof category.image === 'string')
                            .map(category => (
                            <div key={category.id} onClick={() => setSelectedCategory(category.name)} className="group relative rounded-xl overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                                <img src={getOptimizedImageUrl(category.image, 400)} alt={category.name} className="w-full h-32 object-cover" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"></div>
                                <h3 className="absolute bottom-4 right-4 text-white text-lg font-bold" style={{textShadow: '0 1px 4px rgba(0,0,0,0.5)'}}>{category.name}</h3>
                            </div>
                        ))}
                    </div>
                </section>
                
                {topRatedProducts.length > 0 && (
                    <section>
                        <SectionHeader title="الأكثر تقييماً" />
                        <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
                            {topRatedProducts.map(product => (
                                <div key={product.id} className="w-64 sm:w-72 flex-shrink-0">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <SectionHeader title="جميع المنتجات" />
                    {noProductsAvailable ? (
                        <EmptyState message="لا توجد منتجات متاحة في المتجر حالياً." />
                    ) : noSearchResults ? (
                         <EmptyState message="لا توجد منتجات تطابق بحثك" onResetFilters={handleResetFilters} />
                    ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product: Product) => (
                                <ProductCard key={product.id} product={product} />
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

export default HomeScreen;
