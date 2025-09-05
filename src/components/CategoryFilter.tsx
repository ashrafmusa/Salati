import React, { useMemo } from 'react';
// FIX: The `Product` type is obsolete. Replaced with `StoreProduct`.
import { StoreProduct } from '../types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  // FIX: Updated prop type to use `StoreProduct`.
  allProducts: StoreProduct[];
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ selectedCategory, onSelectCategory, allProducts }) => {
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allProducts.map(p => p.category))];
    return ["الكل", ...uniqueCategories];
  }, [allProducts]);

  return (
    <div className="py-4">
      <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap transform active:scale-95 group ${
              selectedCategory === category
                ? 'text-primary dark:text-primary'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="z-10 relative">{category}</span>
            {selectedCategory === category && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-primary rounded-full mt-1"></div>
            )}
             <div className={`absolute inset-0 rounded-full bg-primary/10 transition-transform duration-300 scale-0 group-hover:scale-100 ${selectedCategory === category ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}></div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;