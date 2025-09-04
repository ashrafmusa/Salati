import React from 'react';
import { PlusIcon, SearchIcon } from '../assets/icons';

interface AdminScreenHeaderProps {
  title: string;
  buttonText?: string;
  onButtonClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;
}

const AdminScreenHeader: React.FC<AdminScreenHeaderProps> = ({
  title,
  buttonText,
  onButtonClick,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
}) => {
  const showSearch = onSearchChange !== undefined;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 self-start sm:self-center">{title}</h2>
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
        {showSearch && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full p-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-admin-primary focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
            />
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        )}
        {buttonText && onButtonClick && (
          <button
            onClick={onButtonClick}
            className="w-full sm:w-auto flex items-center justify-center bg-admin-primary text-white px-4 py-2 rounded-lg hover:bg-admin-primary-hover transition-all duration-200 transform active:scale-95 shadow-sm"
          >
            <PlusIcon className="w-5 h-5 ml-2" />
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminScreenHeader;
