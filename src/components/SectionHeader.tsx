import React from 'react';
import { ChevronLeftIcon } from '../assets/icons';

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll, viewAllText = "عرض الكل" }) => {
  return (
    <div className="flex justify-between items-end mb-4 mt-8 first:mt-0 border-b-2 border-slate-200 dark:border-slate-800 pb-2">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 relative">
        {title}
        <span className="absolute -bottom-[9px] right-0 h-1 w-1/3 bg-primary rounded-full"></span>
      </h2>
      {onViewAll && (
        <button onClick={onViewAll} className="flex items-center text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
          <span>{viewAllText}</span>
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
