import React from "react";
import { ChevronLeftIcon, SparklesIcon } from "../assets/icons";

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onViewAll,
  viewAllText = "عرض الكل",
}) => {
  return (
    <div className="flex justify-between items-center mb-6 mt-8 first:mt-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
          <SparklesIcon className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="flex items-center text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          <span>{viewAllText}</span>
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
