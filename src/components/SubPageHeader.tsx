import React from 'react';
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon } from '../assets/icons';

interface SubPageHeaderProps {
  title: string;
  backPath?: string;
  itemCount?: number;
}

const SubPageHeader: React.FC<SubPageHeaderProps> = ({ title, backPath, itemCount }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10 p-1 flex items-center border-b dark:border-slate-800 h-14">
      <button 
        onClick={handleBack} 
        className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 hover:text-primary p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
        aria-label="Go back"
      >
        <ChevronRightIcon className="w-7 h-7"/>
      </button>
      <h1 className="text-lg sm:text-xl font-bold text-center text-slate-800 dark:text-slate-100 flex-grow truncate px-2">
        {title} {itemCount !== undefined && itemCount > 0 && <span className="font-normal text-slate-500">({itemCount})</span>}
      </h1>
      <div className="w-10"></div> {/* Spacer to center the title */}
    </header>
  );
};

export default SubPageHeader;