import React from "react";

const OrderCardSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm animate-pulse">
    <div className="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-700">
      <div>
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
    <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-700 mt-2">
      <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  </div>
);

const OrderHistorySkeleton: React.FC = () => {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export default OrderHistorySkeleton;
