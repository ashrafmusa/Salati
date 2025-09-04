import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

const HomeScreenSkeleton: React.FC = () => {
  return (
    <>
      <header className="sticky top-0 z-20 bg-warmBeige/80 dark:bg-slate-950/80 backdrop-blur-lg border-b dark:border-slate-800">
        <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            <div className="flex-grow h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* Banner Skeleton */}
        <div className="relative w-full h-56 md:h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>

        {/* Categories Skeleton */}
        <section className="mt-8">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
            ))}
            </div>
        </section>
        
        {/* Top Rated Skeleton */}
        <section className="mt-8">
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-64 sm:w-72 flex-shrink-0">
                <ProductCardSkeleton />
                </div>
            ))}
            </div>
        </section>

        {/* All Products Skeleton */}
        <section className="mt-8">
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
            </div>
        </section>
      </main>
    </>
  );
};

export default HomeScreenSkeleton;
