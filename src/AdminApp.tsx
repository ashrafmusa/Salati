import React, { lazy, Suspense, useState, useEffect } from "react";
// FIX: The `react-router-dom` library has module resolution issues in this environment. Changed to a namespace import to resolve "has no exported member" errors.
import * as ReactRouterDOM from "react-router-dom";
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
import ConfigurationChecker from "./components/ConfigurationChecker";

// --- Lazy-loaded Admin Components ---
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboardScreen = lazy(
  () => import("./screens/AdminDashboardScreen")
);
const AdminOrdersScreen = lazy(() => import("./screens/AdminOrdersScreen"));
const AdminProductsScreen = lazy(() => import("./screens/AdminProductsScreen")); // Unified products screen
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
const AdminReportsScreen = lazy(() => import("./screens/AdminReportsScreen"));
const AdminAuditLogScreen = lazy(() => import("./screens/AdminAuditLogScreen"));
const SupplierDashboardScreen = lazy(
  () => import("./screens/SupplierDashboardScreen")
);
// --- SCM Components ---
const AdminSuppliersScreen = lazy(
  () => import("./screens/AdminSuppliersScreen")
);
const AdminPurchaseOrdersScreen = lazy(
  () => import("./screens/AdminPurchaseOrdersScreen")
);
const AdminPurchaseOrderFormScreen = lazy(
  () => import("./screens/AdminPurchaseOrderFormScreen")
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
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/" element={<DriverDashboardScreen />} />
          <ReactRouterDOM.Route
            path="*"
            element={<ReactRouterDOM.Navigate to="/" replace />}
          />
        </ReactRouterDOM.Routes>
      </AdminLayout>
    );
  }

  if (user.role === "supplier") {
    return (
      <AdminLayout>
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route
            path="/"
            element={<SupplierDashboardScreen />}
          />
          <ReactRouterDOM.Route
            path="*"
            element={<ReactRouterDOM.Navigate to="/" replace />}
          />
        </ReactRouterDOM.Routes>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ReactRouterDOM.Routes>
        {/* Routes accessible to all admin levels */}
        <ReactRouterDOM.Route path="/" element={<AdminDashboardScreen />} />
        <ReactRouterDOM.Route path="/orders" element={<AdminOrdersScreen />} />

        {/* Routes for admin and super-admin */}
        {(user.role === "admin" || user.role === "super-admin") && (
          <>
            <ReactRouterDOM.Route
              path="/products"
              element={<AdminProductsScreen />}
            />
            <ReactRouterDOM.Route
              path="/offers"
              element={<AdminOffersScreen />}
            />
            <ReactRouterDOM.Route
              path="/drivers"
              element={<AdminDriversScreen />}
            />
            {/* SCM Routes */}
            <ReactRouterDOM.Route
              path="/suppliers"
              element={<AdminSuppliersScreen />}
            />
            <ReactRouterDOM.Route
              path="/purchase-orders"
              element={<AdminPurchaseOrdersScreen />}
            />
            <ReactRouterDOM.Route
              path="/purchase-orders/new"
              element={<AdminPurchaseOrderFormScreen />}
            />
            <ReactRouterDOM.Route
              path="/purchase-orders/:id"
              element={<AdminPurchaseOrderFormScreen />}
            />
          </>
        )}

        {/* Routes for super-admin only */}
        {user.role === "super-admin" && (
          <>
            <ReactRouterDOM.Route
              path="/users"
              element={<AdminCustomersScreen />}
            />
            <ReactRouterDOM.Route
              path="/categories"
              element={<AdminCategoriesScreen />}
            />
            <ReactRouterDOM.Route
              path="/extras"
              element={<AdminExtrasScreen />}
            />
            <ReactRouterDOM.Route
              path="/settings"
              element={<AdminSettingsScreen />}
            />
            <ReactRouterDOM.Route
              path="/reports"
              element={<AdminReportsScreen />}
            />
            <ReactRouterDOM.Route
              path="/audit-log"
              element={<AdminAuditLogScreen />}
            />
          </>
        )}

        <ReactRouterDOM.Route
          path="*"
          element={<ReactRouterDOM.Navigate to="/" replace />}
        />
      </ReactRouterDOM.Routes>
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
                <ConfigurationChecker>
                  <ReactRouterDOM.HashRouter>
                    <ScrollToTop />
                    <Suspense fallback={<FullScreenLoader />}>
                      <ProtectedAdminRoutes />
                    </Suspense>
                  </ReactRouterDOM.HashRouter>
                </ConfigurationChecker>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AdminApp;
