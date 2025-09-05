import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  OrdersIcon,
  BundlesIcon,
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
} from "../assets/adminIcons";
import AdminNotifications from "./AdminNotifications";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../hooks/useAuth";

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
    to: "/bundles",
    label: "إدارة الحزم",
    icon: BundlesIcon,
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
    to: "/items",
    label: "إدارة الأصناف",
    icon: PackageIcon,
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
];

const Sidebar: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.role === "super-admin";
  const superAdminPaths = [
    "/users",
    "/categories",
    "/extras",
    "/settings",
    "/items",
  ];

  // Regular links visible to all admins based on their role
  const mainNavLinks = navLinks.filter((link) => {
    if (!user || !link.roles.find((r) => r === user.role)) return false;
    if (isSuperAdmin && superAdminPaths.includes(link.to)) return false;
    return true;
  });

  // Links that only appear in the "Super Admin" section
  const superAdminNavLinks = navLinks.filter((link) => {
    if (!isSuperAdmin) return false;
    return superAdminPaths.includes(link.to);
  });

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleLogout = () => {
    logout();
  };

  const linkBaseClasses =
    "relative flex items-center px-4 py-3 my-1 rounded-md transition-all duration-200 group overflow-hidden";
  const inactiveLinkClasses =
    "text-gray-300 hover:bg-admin-sidebar-hover hover:text-white hover:-translate-x-1";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside
        className={`w-64 bg-admin-sidebar text-admin-sidebar-text flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 text-2xl font-bold text-white border-b border-white/10">
          <a href="./admin.html#/">Salati Admin</a>
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-grow p-4 overflow-y-auto">
          <ul>
            {user?.role !== "driver" && (
              <li>
                <a
                  href="./index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkBaseClasses} ${inactiveLinkClasses}`}
                >
                  <EyeIcon className="w-6 h-6 ml-3 transition-transform group-hover:scale-110" />
                  <span>عرض الموقع</span>
                  <div className="absolute right-0 top-0 h-full w-1 bg-white/80 transition-transform duration-300 ease-in-out scale-y-0 group-hover:scale-y-75"></div>
                </a>
              </li>
            )}
            {mainNavLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `${linkBaseClasses} ${
                      isActive
                        ? "bg-admin-primary text-white font-bold shadow-inner shadow-black/20"
                        : inactiveLinkClasses
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className="w-6 h-6 ml-3 transition-transform group-hover:scale-110" />
                      <span>{link.label}</span>
                      <div
                        className={`absolute right-0 top-0 h-full w-1 bg-white/80 transition-transform duration-300 ease-in-out ${
                          isActive
                            ? "scale-y-100"
                            : "scale-y-0 group-hover:scale-y-75"
                        }`}
                      ></div>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <h3 className="px-4 text-xs font-semibold uppercase text-slate-400 mb-2 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Super Admin Controls</span>
              </h3>
              <ul>
                {superAdminNavLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `${linkBaseClasses} ${
                          isActive
                            ? "bg-admin-primary text-white font-bold shadow-inner shadow-black/20"
                            : inactiveLinkClasses
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <link.icon className="w-6 h-6 ml-3 transition-transform group-hover:scale-110" />
                          <span>{link.label}</span>
                          <div
                            className={`absolute right-0 top-0 h-full w-1 bg-white/80 transition-transform duration-300 ease-in-out ${
                              isActive
                                ? "scale-y-100"
                                : "scale-y-0 group-hover:scale-y-75"
                            }`}
                          ></div>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-right px-4 py-3 rounded-md text-slate-300 hover:bg-admin-sidebar-hover hover:text-white transition-colors duration-200"
          >
            <LogoutIcon className="w-6 h-6 ml-3" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentLink = navLinks
    .slice()
    .reverse()
    .find((link) => location.pathname.startsWith(link.to) && link.to !== "/");
  let title = currentLink ? currentLink.label : "لوحة التحكم";

  if (user?.role === "driver") {
    title = "مهام التوصيل";
  }

  return (
    <header className="bg-warmBeige/80 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 border-b dark:border-slate-800">
      <div className="flex items-center">
        <button
          className="md:hidden text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white mr-4"
          onClick={onMenuClick}
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl md:text-2xl font-semibold text-charcoal dark:text-slate-100">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {user?.role !== "driver" && <AdminNotifications />}
        <ThemeToggle />
      </div>
    </header>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-admin-bg dark:bg-slate-900 text-charcoal dark:text-slate-200">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col transition-all duration-300 md:mr-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
