import React from 'react';

const SkeletonLoader = () => (
    <div className="bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
);

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border dark:border-slate-800">
      <div className="relative">
        <div className="w-full h-40 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
      </div>
      <div className="p-4">
        <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-3"></div>
        <div className="flex justify-between items-center mt-4">
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="h-11 w-11 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;