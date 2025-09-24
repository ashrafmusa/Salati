import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from "react-router-dom";
const { useLocation, NavLink } = ReactRouterDOM;
import { HomeIcon, CartIcon, UserIcon, HeartIcon, BuildingOfficeIcon } from '../assets/icons';
import { useCart } from '../hooks/useCart';
import { useScrollDirection } from '../hooks/useScrollDirection';

// A simple event bus to communicate cart updates to the nav bar
const cartUpdateEvents = new EventTarget();
export const dispatchCartUpdate = () => cartUpdateEvents.dispatchEvent(new Event('cart-updated'));


const NavigationBar: React.FC = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [activePillStyle, setActivePillStyle] = useState({});
  const [isCartBumping, setIsCartBumping] = useState(false);
  const isVisible = useScrollDirection();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'الرئيسية' },
    { path: '/real-estate', icon: BuildingOfficeIcon, label: 'العقارات' },
    { path: '/wishlist', icon: HeartIcon, label: 'المفضلة' },
    { path: '/cart', icon: CartIcon, label: 'السلة' },
    { path: '/profile', icon: UserIcon, label: 'حسابي' },
  ];
  
  // Animate the cart icon when an item is added
  useEffect(() => {
    const handleCartUpdate = () => {
        setIsCartBumping(true);
        setTimeout(() => setIsCartBumping(false), 400); // Duration of the animation
    };
    cartUpdateEvents.addEventListener('cart-updated', handleCartUpdate);
    return () => cartUpdateEvents.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  // Animate the active pill background
  useEffect(() => {
    const activeLink = navRef.current?.querySelector('.active-nav-link');
    if (activeLink && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setActivePillStyle({
            width: `${linkRect.width}px`,
            transform: `translateX(${linkRect.left - navRect.left}px)`,
        });
    }
  }, [location.pathname]);

  return (
    <nav 
        ref={navRef} 
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg-up z-20 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="relative flex justify-around max-w-md mx-auto p-1">
        <div 
          className="absolute top-1 h-[calc(100%-0.5rem)] bg-primary/10 rounded-lg transition-all duration-300 ease-in-out"
          style={activePillStyle}
        />
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full py-2 z-10 transition-colors duration-300 group
               ${isActive ? 'active-nav-link text-primary' : 'text-slate-500 dark:text-slate-400'}`
            }
          >
            <div className="relative">
              <item.icon className={`w-7 h-7 transition-transform duration-200 ${item.path === '/cart' && isCartBumping ? 'animate-jiggle' : ''}`} />
              {item.path === '/cart' && cartCount > 0 && (
                <div aria-live="polite" className="absolute -top-1 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {cartCount}
                </div>
              )}
            </div>
            <span className="text-xs mt-1 font-semibold">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default NavigationBar;