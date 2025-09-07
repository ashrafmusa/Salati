
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../assets/icons';

interface PaginationProps {
  onNext: () => void;
  onPrev: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ onNext, onPrev, hasNextPage, hasPrevPage }) => {
  const buttonClasses = "px-4 py-2 flex items-center gap-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const activeClasses = "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-sm border dark:border-slate-600";
  const disabledClasses = "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500";

  return (
    <div className="flex justify-center items-center gap-4 mt-auto pt-4">
      <button onClick={onPrev} disabled={!hasPrevPage} className={`${buttonClasses} ${hasPrevPage ? activeClasses : disabledClasses}`}>
        <ChevronRightIcon className="w-4 h-4" />
        <span>السابق</span>
      </button>
      <button onClick={onNext} disabled={!hasNextPage} className={`${buttonClasses} ${hasNextPage ? activeClasses : disabledClasses}`}>
        <span>التالي</span>
        <ChevronLeftIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
