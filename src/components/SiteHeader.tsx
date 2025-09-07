

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import Logo from './Logo';
import { SearchIcon, FilterIcon, HomeIcon, HeartIcon, CartIcon, UserIcon } from '../assets/icons';
import { useCart } from '../hooks/useCart';

interface SiteHeaderProps {
    onFilterClick: () => void;
    areFiltersActive: boolean;
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ onFilterClick, areFiltersActive }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const { getCartCount } = useCart();
    const cartCount = getCartCount();
    
    const navItems = [
      { path: '/', icon: HomeIcon, label: 'الرئيسية' },
      { path: '/wishlist', icon: HeartIcon, label: 'المفضلة' },
      { path: '/cart', icon: CartIcon, label: 'السلة' },
      { path: '/profile', icon: UserIcon, label: 'حسابي' },
    ];
    
    useEffect(() => {
        setSearchTerm(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSearch = searchTerm.trim();
        if (trimmedSearch) {
            navigate(`/search?q=${trimmedSearch}`);
        } else {
            navigate('/');
        }
    };

    return (
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b dark:border-slate-800 transition-shadow duration-300 header-shadow">
            <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto flex items-center gap-4">
                <Logo 
                    imgProps={{ width: 48, height: 48 }}
                    imgClassName="w-10 sm:w-12"
                    textClassName="hidden sm:block text-2xl"
                />
                
                <nav className="hidden md:flex items-center gap-2 ml-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 group ${
                                isActive 
                                    ? 'bg-primary/10 text-primary' 
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                             {item.path === '/cart' && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    {cartCount}
                                </span>
                             )}
                        </NavLink>
                    ))}
                </nav>

                <form onSubmit={handleSearchSubmit} className="relative flex-grow md:flex-grow-0 md:w-64">
                    <input
                        type="text"
                        placeholder="ابحث عن منتج..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:border-transparent focus:outline-none transition-shadow"
                    />
                    <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2" aria-label="Search">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </button>
                </form>
                <button
                    onClick={onFilterClick}
                    className="relative flex-shrink-0 p-2 rounded-full text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Open product filters"
                >
                    <FilterIcon className="w-5 h-5"/>
                    {areFiltersActive && <span className="absolute -top-1 -right-1 block w-3 h-3 bg-primary rounded-full border-2 border-slate-50 dark:border-slate-900"></span>}
                </button>
            </div>
        </header>
    );
};

export default SiteHeader;