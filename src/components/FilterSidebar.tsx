import React, { useState, useEffect } from 'react';
import { StarIcon, CloseIcon } from '../assets/icons';

export interface Filters {
  priceRange: { min: number; max: number };
  rating: number;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
  initialFilters: Filters;
  maxPrice: number;
}

const RatingFilter: React.FC<{ selectedRating: number; onSelect: (rating: number) => void }> = ({ selectedRating, onSelect }) => {
  const ratings = [4, 3, 2, 1];
  return (
    <div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">التقييم</h3>
      <div className="flex flex-wrap gap-2">
        {ratings.map(r => (
          <button
            key={r}
            onClick={() => onSelect(selectedRating === r ? 0 : r)}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
              selectedRating === r
                ? 'bg-primary text-white shadow'
                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            {r} <StarIcon filled className="w-4 h-4 text-yellow-400" /> &amp; أعلى
          </button>
        ))}
      </div>
    </div>
  );
};

const PriceRangeSlider: React.FC<{ min: number; max: number; onPriceChange: (min: number, max: number) => void; maxRange: number; }> = ({ min, max, onPriceChange, maxRange }) => {
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), max - 100); 
        onPriceChange(newMin, max);
    };
    
    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), min + 100);
        onPriceChange(min, newMax);
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">نطاق السعر</h3>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="minPrice" className="text-sm text-slate-600 dark:text-slate-300">الحد الأدنى</label>
                        <span className="font-bold text-primary">{min} ج.س</span>
                    </div>
                    <input id="minPrice" type="range" min={0} max={maxRange} value={min} onChange={handleMinChange} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor="maxPrice" className="text-sm text-slate-600 dark:text-slate-300">الحد الأقصى</label>
                        <span className="font-bold text-primary">{max} ج.س</span>
                    </div>
                    <input id="maxPrice" type="range" min={0} max={maxRange} value={max} onChange={handleMaxChange} className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>
        </div>
    );
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ isOpen, onClose, onApply, initialFilters, maxPrice }) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handlePriceChange = (min: number, max: number) => {
    setFilters(prev => ({ ...prev, priceRange: { min, max } }));
  };

  const handleRatingChange = (rating: number) => {
    setFilters(prev => ({ ...prev, rating }));
  };
  
  const handleReset = () => {
    const resetFilters = {
        priceRange: { min: 0, max: maxPrice },
        rating: 0,
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };
  
  const handleApply = () => {
      onApply(filters);
      onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside className={`w-80 bg-slate-50 dark:bg-slate-900 flex flex-col fixed h-full top-0 right-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} dark:border-r dark:border-slate-800`}>
        <div className="h-16 flex items-center justify-between px-4 border-b dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">الفلاتر</h2>
            <button className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary" onClick={onClose}>
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        
        <div className="flex-grow p-6 space-y-8 overflow-y-auto">
            <PriceRangeSlider 
                min={filters.priceRange.min}
                max={filters.priceRange.max}
                onPriceChange={handlePriceChange}
                maxRange={maxPrice}
            />
            <RatingFilter
                selectedRating={filters.rating}
                onSelect={handleRatingChange}
            />
        </div>

        <div className="p-4 border-t dark:border-slate-800 grid grid-cols-2 gap-4">
            <button onClick={handleReset} className="px-6 py-3 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold">
                إعادة تعيين
            </button>
            <button onClick={handleApply} className="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-secondary transition-colors shadow">
                تطبيق
            </button>
        </div>
      </aside>
    </>
  );
};

export default FilterSidebar;