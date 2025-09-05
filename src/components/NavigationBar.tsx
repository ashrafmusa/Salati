import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, CartIcon, UserIcon, HeartIcon } from "../assets/icons";
import { useCart } from "../hooks/useCart";

const NavigationBar: React.FC = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "الرئيسية" },
    { path: "/wishlist", icon: HeartIcon, label: "المفضلة" },
    { path: "/cart", icon: CartIcon, label: "السلة" },
    { path: "/profile", icon: UserIcon, label: "حسابي" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg-up z-20">
      <div className="flex justify-around max-w-md mx-auto p-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all duration-300 group transform active:scale-90 ${
                isActive
                  ? "bg-primary/10 text-primary scale-105"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`
            }
          >
            <div className="relative">
              <item.icon
                className={`w-7 h-7 transition-transform duration-200 ${
                  item.path === "/wishlist" && location.pathname === "/wishlist"
                    ? "text-red-500"
                    : ""
                }`}
              />
              {item.path === "/cart" && cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 font-semibold`}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default NavigationBar;
