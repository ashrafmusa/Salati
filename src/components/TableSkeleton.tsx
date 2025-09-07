import React from 'react';

const SkeletonRow = () => (
    <tr className="border-b dark:border-slate-700">
        <td className="p-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </td>
        <td className="p-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </td>
        <td className="p-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </td>
        <td className="p-3">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </td>
    </tr>
);

const SkeletonCard = () => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border dark:border-slate-700 space-y-3 animate-pulse">
        <div className="flex justify-between items-center">
            <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="pt-3 border-t dark:border-slate-700 flex justify-end">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
    </div>
);


const TableSkeleton: React.FC = () => {
    return (
        <div>
            {/* Desktop Skeleton */}
            <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-right">
                    <thead className="border-b-2 border-slate-100 dark:border-slate-700">
                        <tr>
                            <th className="p-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div></th>
                            <th className="p-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div></th>
                            <th className="p-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div></th>
                            <th className="p-3"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                </table>
            </div>
            {/* Mobile Skeleton */}
            <div className="space-y-4 md:hidden">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        </div>
    );
};

export default TableSkeleton;
