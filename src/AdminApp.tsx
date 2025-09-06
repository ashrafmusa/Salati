import React, { lazy, Suspense, useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import FullScreenLoader from "./components/FullScreenLoader";
import { ToastProvider } from "./contexts/ToastContext";
import { initializeFirebase } from "./firebase/config";
import ScrollToTop from "./components/ScrollToTop";
import { SettingsProvider } from "./contexts/SettingsContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";

// --- Lazy-loaded Admin Components ---
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboardScreen = lazy(
  () => import("./screens/AdminDashboardScreen")
);
const AdminOrdersScreen = lazy(() => import("./screens/AdminOrdersScreen"));
const AdminBundlesScreen = lazy(() => import("./screens/AdminProductsScreen"));
const AdminItemsScreen = lazy(() => import("./screens/AdminItemsScreen"));
const AdminCustomersScreen = lazy(
  () => import("./screens/AdminCustomersScreen")
);
const AdminOffersScreen = lazy(() => import("./screens/AdminOffersScreen"));
const AdminDriversScreen = lazy(() => import("./screens/AdminDriversScreen"));
const AdminCategoriesScreen = lazy(
  () => import("./screens/AdminCategoriesScreen")
);
const AdminExtrasScreen = lazy(() => import("./screens/AdminExtrasScreen"));
const AdminSettingsScreen = lazy(() => import("./screens/AdminSettingsScreen"));
const DriverDashboardScreen = lazy(
  () => import("./screens/DriverDashboardScreen")
);

const ProtectedAdminRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user || user.role === "customer") {
    window.location.href = "./index.html#/login";
    return null;
  }

  if (user.role === "driver") {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/" element={<DriverDashboardScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        {/* Routes accessible to all admin levels */}
        <Route path="/" element={<AdminDashboardScreen />} />
        <Route path="/orders" element={<AdminOrdersScreen />} />

        {/* Routes for admin and super-admin */}
        {(user.role === "admin" || user.role === "super-admin") && (
          <>
            <Route path="/bundles" element={<AdminBundlesScreen />} />
            <Route path="/offers" element={<AdminOffersScreen />} />
            <Route path="/drivers" element={<AdminDriversScreen />} />
          </>
        )}

        {/* Routes for super-admin only */}
        {user.role === "super-admin" && (
          <>
            <Route path="/users" element={<AdminCustomersScreen />} />
            <Route path="/items" element={<AdminItemsScreen />} />
            <Route path="/categories" element={<AdminCategoriesScreen />} />
            <Route path="/extras" element={<AdminExtrasScreen />} />
            <Route path="/settings" element={<AdminSettingsScreen />} />
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
};

const AdminApp: React.FC = () => {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    const loadFirebase = async () => {
      await initializeFirebase();
      setIsFirebaseReady(true);
    };
    loadFirebase();
  }, []);

  if (!isFirebaseReady) {
    return <FullScreenLoader />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <HashRouter>
                  <ScrollToTop />
                  <Suspense fallback={<FullScreenLoader />}>
                    <ProtectedAdminRoutes />
                  </Suspense>
                </HashRouter>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AdminApp;
