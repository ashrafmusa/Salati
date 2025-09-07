
import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, OrdersIcon, BundlesIcon, MenuIcon } from '../assets/adminIcons';
import { useAuth } from '../hooks/useAuth';

interface AdminNavigationBarProps {
  onMenuClick: () => void;
}

const AdminNavigationBar: React.FC<AdminNavigationBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { path: '/', icon: DashboardIcon, label: 'الرئيسية', roles: ['sub-admin', 'admin', 'super-admin'] },
    { path: '/orders', icon: OrdersIcon, label: 'الطلبات', roles: ['sub-admin', 'admin', 'super-admin'] },
    { path: '/bundles', icon: BundlesIcon, label: 'الحزم', roles: ['admin', 'super-admin'] },
  ];
  
  const accessibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg-up z-30">
      <div className="flex justify-around max-w-md mx-auto p-1">
        {accessibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all duration-300 group transform active:scale-90 ${
                isActive 
                  ? 'bg-admin-primary/10 text-admin-primary scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-7 h-7" />
            <span className="text-xs mt-1 font-semibold">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all duration-300 group transform active:scale-90 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <MenuIcon className="w-7 h-7" />
          <span className="text-xs mt-1 font-semibold">القائمة</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminNavigationBar;
