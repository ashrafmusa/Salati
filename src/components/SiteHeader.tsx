
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, NavLink, Link } from 'react-router-dom';
import Logo from './Logo';
import { SearchIcon, FilterIcon, HomeIcon, HeartIcon, CartIcon, UserIcon } from '../assets/icons';
import { useCart } from '../hooks/useCart';
// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import { db } from '../firebase/config';
import { StoreProduct, Item, Bundle } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';
import { getOptimizedImageUrl } from '../utils/helpers';

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
    
    const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
    const [suggestions, setSuggestions] = useState<StoreProduct[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    useClickOutside(searchRef, () => setIsDropdownOpen(false));
    
    useEffect(() => {
        const fetchAllProducts = async () => {
            // FIX: Refactored Firestore getDocs and collection calls to use v8 compat syntax.
             const itemsSnapshot = await db.collection('items').get();
             const bundlesSnapshot = await db.collection('bundles').get();
             const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'item' } as Item));
             const bundles = bundlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'bundle' } as Bundle));
             setAllProducts([...items, ...bundles]);
        };
        fetchAllProducts();
    }, []);

    useEffect(() => {
        const query = searchTerm.trim().toLowerCase();
        if (query) {
            const filtered = allProducts.filter(p => p.arabicName.toLowerCase().includes(query) || p.name.toLowerCase().includes(query));
            setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
            setIsDropdownOpen(true);
        } else {
            setSuggestions([]);
            setIsDropdownOpen(false);
        }
    }, [searchTerm, allProducts]);
    
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
        setIsDropdownOpen(false);
    };

    const navItems = [
      { path: '/', icon: HomeIcon, label: 'الرئيسية' },
      { path: '/wishlist', icon: HeartIcon, label: 'المفضلة' },
      { path: '/cart', icon: CartIcon, label: 'السلة' },
      { path: '/profile', icon: UserIcon, label: 'حسابي' },
    ];

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

                <div ref={searchRef} className="relative flex-grow md:flex-grow-0 md:w-64">
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => searchTerm && setIsDropdownOpen(true)}
                            className="w-full pl-10 pr-4 py-2 rounded-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:border-transparent focus:outline-none transition-shadow"
                        />
                        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2" aria-label="Search">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </form>
                    {isDropdownOpen && suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 overflow-hidden">
                            <ul>
                                {suggestions.map(product => (
                                    <li key={product.id}>
                                        <Link
                                            to={product.type === 'item' ? `/item/${product.id}` : `/bundle/${product.id}`}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <img src={getOptimizedImageUrl(product.imageUrl, 100)} alt={product.arabicName} className="w-10 h-10 rounded-md object-cover" />
                                            <span className="font-semibold text-sm">{product.arabicName}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
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
