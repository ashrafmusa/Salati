import React from 'react';
// FIX: Switched to a namespace import for react-router-dom to fix module resolution errors in the build environment.
import * as ReactRouterDOM from 'react-router-dom';
import { DashboardIcon, OrdersIcon, PackageIcon, MenuIcon } from '../assets/adminIcons';
import { useAuth } from '../hooks/useAuth';

interface AdminNavigationBarProps {
  onMenuClick: () => void;
}

const AdminNavigationBar: React.FC<AdminNavigationBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = [
    { path: '/', icon: DashboardIcon, label: 'الرئيسية', roles: ['sub-admin', 'admin', 'super-admin', 'driver', 'supplier'] },
    { path: '/orders', icon: OrdersIcon, label: 'الطلبات', roles: ['sub-admin', 'admin', 'super-admin'] },
    { path: '/products', icon: PackageIcon, label: 'المنتجات', roles: ['admin', 'super-admin'] },
  ];
  
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role as any));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-lg-up z-30 flex justify-around p-1">
      {filteredNavItems.map(item => (
        <ReactRouterDOM.NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full py-2 transition-colors ${isActive ? 'text-admin-primary' : 'text-slate-500 dark:text-slate-400'}`
          }
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs mt-1">{item.label}</span>
        </ReactRouterDOM.NavLink>
      ))}
      <button onClick={onMenuClick} className="flex flex-col items-center justify-center w-full py-2 text-slate-500 dark:text-slate-400">
        <MenuIcon className="w-6 h-6" />
        <span className="text-xs mt-1">القائمة</span>
      </button>
    </nav>
  );
};

export default AdminNavigationBar;