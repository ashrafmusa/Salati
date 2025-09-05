import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "./Logo";
import { SearchIcon, FilterIcon } from "../assets/icons";

interface SiteHeaderProps {
  onFilterClick: () => void;
  areFiltersActive: boolean;
}

const SiteHeader: React.FC<SiteHeaderProps> = ({
  onFilterClick,
  areFiltersActive,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  // Sync search term with URL query parameter
  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      navigate(`/search?q=${trimmedSearch}`);
    } else {
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-warmBeige/80 dark:bg-slate-950/80 backdrop-blur-lg border-b dark:border-slate-800 transition-shadow duration-300 header-shadow">
      <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center gap-4">
        <Logo
          imgClassName="w-10 sm:w-12"
          textClassName="hidden sm:block text-2xl"
        />
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <input
            id="onboarding-search"
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:border-transparent focus:outline-none transition-shadow"
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2"
            aria-label="Search"
          >
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </button>
        </form>
        <button
          id="onboarding-filter"
          onClick={onFilterClick}
          className="relative flex-shrink-0 p-2 rounded-full text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <FilterIcon className="w-5 h-5" />
          {areFiltersActive && (
            <span className="absolute -top-1 -right-1 block w-3 h-3 bg-primary rounded-full border-2 border-warmBeige dark:border-slate-950"></span>
          )}
        </button>
      </div>
    </header>
  );
};

export default SiteHeader;
