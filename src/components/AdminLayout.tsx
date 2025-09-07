import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  OrdersIcon,
  CustomersIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  GiftIcon,
  TruckIcon,
  EyeIcon,
  CategoryIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CogIcon,
  PackageIcon,
  UserCircleIcon,
  ChartBarIcon,
  ClipboardListIcon,
  ChevronDoubleLeftIcon,
} from "../assets/adminIcons";
import AdminNotifications from "./AdminNotifications";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../hooks/useAuth";
import AdminNavigationBar from "./AdminNavigationBar";

interface NavLinkItem {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  roles: ("sub-admin" | "admin" | "super-admin" | "driver")[];
}

const navLinks: NavLinkItem[] = [
  {
    to: "/",
    label: "لوحة التحكم",
    icon: DashboardIcon,
    roles: ["sub-admin", "admin", "super-admin", "driver"],
  },
  {
    to: "/orders",
    label: "إدارة الطلبات",
    icon: OrdersIcon,
    roles: ["sub-admin", "admin", "super-admin"],
  },
  {
    to: "/products",
    label: "إدارة المنتجات",
    icon: PackageIcon,
    roles: ["admin", "super-admin"],
  },
  {
    to: "/offers",
    label: "إدارة العروض",
    icon: GiftIcon,
    roles: ["admin", "super-admin"],
  },
  {
    to: "/drivers",
    label: "إدارة السائقين",
    icon: TruckIcon,
    roles: ["admin", "super-admin"],
  },
  {
    to: "/users",
    label: "إدارة المستخدمين",
    icon: CustomersIcon,
    roles: ["super-admin"],
  },
  {
    to: "/categories",
    label: "إدارة الفئات",
    icon: CategoryIcon,
    roles: ["super-admin"],
  },
  {
    to: "/extras",
    label: "إدارة الإضافات",
    icon: BeakerIcon,
    roles: ["super-admin"],
  },
  {
    to: "/settings",
    label: "إعدادات المتجر",
    icon: CogIcon,
    roles: ["super-admin"],
  },
  {
    to: "/reports",
    label: "التقارير",
    icon: ChartBarIcon,
    roles: ["super-admin"],
  },
  {
    to: "/audit-log",
    label: "سجل التدقيق",
    icon: ClipboardListIcon,
    roles: ["super-admin"],
  },
];

const Sidebar: React.FC<{
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isDesktopCollapsed: boolean;
  setDesktopCollapsed: (isCollapsed: boolean) => void;
}> = ({
  isMobileOpen,
  setMobileOpen,
  isDesktopCollapsed,
  setDesktopCollapsed,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === "super-admin";
  const superAdminPaths = [
    "/users",
    "/categories",
    "/extras",
    "/settings",
    "/reports",
    "/audit-log",
  ];

  // FIX: Added a check for `user.role !== 'customer'` to satisfy TypeScript's type narrowing.
  // The `user.role` from `useAuth` includes 'customer', which is not a valid role for admin navigation links.
  // This check ensures type safety before calling `link.roles.includes()`.
  const mainNavLinks = navLinks.filter(
    (link) =>
      user &&
      user.role !== "customer" &&
      link.roles.includes(user.role) &&
      !superAdminPaths.includes(link.to)
  );
  const superAdminNavLinks = navLinks.filter(
    (link) => isSuperAdmin && superAdminPaths.includes(link.to)
  );

  useEffect(() => {
    if (isMobileOpen) {
      setMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const NavItem: React.FC<{ link: NavLinkItem }> = ({ link }) => (
    <NavLink
      to={link.to}
      end={link.to === "/"}
      className={({ isActive }) =>
        `relative flex items-center p-3 my-1 rounded-md transition-colors duration-200 group
        ${
          isActive
            ? "bg-admin-primary/20 text-white font-bold"
            : "text-gray-300 hover:bg-admin-sidebar-hover hover:text-white"
        }`
      }
    >
      <link.icon className="w-6 h-6 flex-shrink-0" />
      <span
        className={`mr-4 transition-opacity duration-200 ${
          isDesktopCollapsed ? "opacity-0" : "opacity-100"
        }`}
      >
        {link.label}
      </span>
      {isDesktopCollapsed && (
        <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md bg-slate-800 text-white text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100 z-50">
          {link.label}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`bg-admin-sidebar text-admin-sidebar-text flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out
        md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "translate-x-full"}
        ${isDesktopCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div
          className={`h-16 flex items-center border-b border-white/10 ${
            isDesktopCollapsed ? "justify-center" : "justify-between px-4"
          }`}
        >
          <a
            href="./admin.html#/"
            className={`text-2xl font-bold text-white whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
              isDesktopCollapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            Salati Admin
          </a>
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow p-3 overflow-y-auto overflow-x-hidden">
          <ul>
            {user?.role !== "driver" && (
              <li>
                <a
                  href="./index.html#/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center p-3 my-1 rounded-md transition-colors duration-200 group text-gray-300 hover:bg-admin-sidebar-hover hover:text-white"
                >
                  <EyeIcon className="w-6 h-6 flex-shrink-0" />
                  <span
                    className={`mr-4 transition-opacity duration-200 ${
                      isDesktopCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    عرض الموقع
                  </span>
                  {isDesktopCollapsed && (
                    <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md bg-slate-800 text-white text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100 z-50">
                      عرض الموقع
                    </span>
                  )}
                </a>
              </li>
            )}
            {mainNavLinks.map((link) => (
              <li key={link.to}>
                <NavItem link={link} />
              </li>
            ))}
          </ul>

          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3
                className={`px-2 text-xs font-semibold uppercase text-slate-400 mb-2 flex items-center gap-2 whitespace-nowrap transition-opacity duration-200 ${
                  isDesktopCollapsed ? "opacity-0" : "opacity-100"
                }`}
              >
                <ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />
                <span>Super Admin</span>
              </h3>
              <ul>
                {superAdminNavLinks.map((link) => (
                  <li key={link.to}>
                    <NavItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center">
            <UserCircleIcon
              className={`w-10 h-10 text-slate-400 flex-shrink-0`}
            />
            <div
              className={`mr-3 overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
                isDesktopCollapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              <p className="font-bold text-sm text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-400 capitalize">
                {user?.role.replace("-", " ")}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="relative flex items-center w-full mt-3 p-3 rounded-md text-slate-300 hover:bg-admin-sidebar-hover hover:text-white transition-colors duration-200 group"
          >
            <LogoutIcon className="w-6 h-6 flex-shrink-0" />
            <span
              className={`mr-4 transition-opacity duration-200 ${
                isDesktopCollapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              تسجيل الخروج
            </span>
            {isDesktopCollapsed && (
              <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md bg-slate-800 text-white text-xs font-bold transition-all duration-100 scale-0 origin-left group-hover:scale-100 z-50">
                تسجيل الخروج
              </span>
            )}
          </button>
          <button
            onClick={() => setDesktopCollapsed(!isDesktopCollapsed)}
            className="hidden md:flex items-center w-full mt-2 p-3 rounded-md text-slate-400 hover:bg-admin-sidebar-hover hover:text-white"
          >
            <ChevronDoubleLeftIcon
              className={`w-6 h-6 transition-transform duration-300 ${
                isDesktopCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
};

const Header: React.FC<{
  onMenuClick: () => void;
  isDesktopCollapsed: boolean;
}> = ({ onMenuClick, isDesktopCollapsed }) => {
  const location = useLocation();
  const { user } = useAuth();

  const currentLink = navLinks
    .slice()
    .reverse()
    .find(
      (link) =>
        location.pathname.startsWith(link.to) &&
        (link.to !== "/" || location.pathname === "/")
    );

  let title = currentLink ? currentLink.label : "لوحة التحكم";
  const Icon = currentLink ? currentLink.icon : DashboardIcon;

  if (user?.role === "driver") {
    title = "مهام التوصيل";
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 border-b dark:border-slate-700">
      <div className="flex items-center gap-3">
        <button
          className={`text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white mr-1
                    ${isDesktopCollapsed ? "md:hidden" : "md:hidden"}`}
          onClick={onMenuClick}
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500 dark:text-slate-300" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {user?.role !== "driver" && <AdminNotifications />}
        <ThemeToggle />
      </div>
    </header>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isDesktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-charcoal dark:text-slate-200">
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
        isDesktopCollapsed={isDesktopCollapsed}
        setDesktopCollapsed={setDesktopCollapsed}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isDesktopCollapsed ? "md:mr-20" : "md:mr-64"
        }`}
      >
        <Header
          onMenuClick={() => setMobileOpen(true)}
          isDesktopCollapsed={isDesktopCollapsed}
        />
        <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden">
          <div
            key={useLocation().pathname}
            className="animate-fade-in h-full overflow-y-auto"
          >
            {children}
          </div>
        </main>
        <footer className="text-center text-sm text-slate-500 dark:text-slate-400 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          &copy; {new Date().getFullYear()} Salati Admin Panel. All Rights
          Reserved.
        </footer>
      </div>
      <AdminNavigationBar onMenuClick={() => setMobileOpen(true)} />
    </div>
  );
};

export default AdminLayout;
