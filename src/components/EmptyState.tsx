import React from 'react';
import { EmptyBoxIcon } from '../assets/icons';

interface EmptyStateProps {
  message: string;
  onResetFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, onResetFilters }) => {
  return (
    <div className="text-center py-16 flex flex-col items-center col-span-full">
      <div className="bg-slate-100 dark:bg-slate-800 p-6 sm:p-8 rounded-full mb-6">
        <EmptyBoxIcon className="w-16 h-16 sm:w-24 sm:h-24 text-slate-400 dark:text-slate-500" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">{message}</h2>
      {onResetFilters && (
        <>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xs">حاول تغيير الفلاتر أو إعادة تعيينها.</p>
          <button
            onClick={onResetFilters}
            className="bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-secondary transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl"
          >
            إعادة تعيين الفلاتر
          </button>
        </>
      )}
    </div>
  );
};

export default EmptyState;