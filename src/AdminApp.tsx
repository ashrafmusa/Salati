import React, { lazy, Suspense, useState, useEffect } from 'react';
// FIX: Combined react-router-dom imports to resolve module export errors.
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import FullScreenLoader from './components/FullScreenLoader';
import { ToastProvider } from './contexts/ToastContext';
import { initializeFirebase } from './firebase/config';
import ScrollToTop from './components/ScrollToTop';
import { SettingsProvider } from './contexts/SettingsContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import ConfigurationChecker from './components/ConfigurationChecker';

// --- Lazy-loaded Admin Components ---
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboardScreen = lazy(() => import('./screens/AdminDashboardScreen'));
const AdminOrdersScreen = lazy(() => import('./screens/AdminOrdersScreen'));
const AdminProductsScreen = lazy(() => import('./screens/AdminProductsScreen')); // Unified products screen
const AdminCustomersScreen = lazy(() => import('./screens/AdminCustomersScreen'));
const AdminOffersScreen = lazy(() => import('./screens/AdminOffersScreen'));
const AdminDriversScreen = lazy(() => import('./screens/AdminDriversScreen'));
const AdminCategoriesScreen = lazy(() => import('./screens/AdminCategoriesScreen'));
const AdminExtrasScreen = lazy(() => import('./screens/AdminExtrasScreen'));
const AdminSettingsScreen = lazy(() => import('./screens/AdminSettingsScreen'));
const DriverDashboardScreen = lazy(() => import('./screens/DriverDashboardScreen'));
const AdminReportsScreen = lazy(() => import('./screens/AdminReportsScreen'));
const AdminAuditLogScreen = lazy(() => import('./screens/AdminAuditLogScreen'));
const SupplierDashboardScreen = lazy(() => import('./screens/SupplierDashboardScreen'));
// --- SCM Components ---
const AdminSuppliersScreen = lazy(() => import('./screens/AdminSuppliersScreen'));
const AdminPurchaseOrdersScreen = lazy(() => import('./screens/AdminPurchaseOrdersScreen'));
const AdminPurchaseOrderFormScreen = lazy(() => import('./screens/AdminPurchaseOrderFormScreen'));


const ProtectedAdminRoutes: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    if (!user || user.role === 'customer') {
        window.location.href = './index.html#/login';
        return null;
    }

    if (user.role === 'driver') {
        return (
            <AdminLayout>
                <Routes>
                    <Route path="/" element={<DriverDashboardScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AdminLayout>
        );
    }

    if (user.role === 'supplier') {
        return (
            <AdminLayout>
                <Routes>
                    <Route path="/" element={<SupplierDashboardScreen />} />
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
                {(user.role === 'admin' || user.role === 'super-admin') && (
                    <>
                        <Route path="/products" element={<AdminProductsScreen />} />
                        <Route path="/offers" element={<AdminOffersScreen />} />
                        <Route path="/drivers" element={<AdminDriversScreen />} />
                        {/* SCM Routes */}
                        <Route path="/suppliers" element={<AdminSuppliersScreen />} />
                        <Route path="/purchase-orders" element={<AdminPurchaseOrdersScreen />} />
                        <Route path="/purchase-orders/new" element={<AdminPurchaseOrderFormScreen />} />
                        <Route path="/purchase-orders/:id" element={<AdminPurchaseOrderFormScreen />} />
                    </>
                )}

                {/* Routes for super-admin only */}
                {user.role === 'super-admin' && (
                    <>
                        <Route path="/users" element={<AdminCustomersScreen />} />
                        <Route path="/categories" element={<AdminCategoriesScreen />} />
                        <Route path="/extras" element={<AdminExtrasScreen />} />
                        <Route path="/settings" element={<AdminSettingsScreen />} />
                        <Route path="/reports" element={<AdminReportsScreen />} />
                        <Route path="/audit-log" element={<AdminAuditLogScreen />} />
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
                <ConfigurationChecker>
                    <HashRouter>
                    <ScrollToTop />
                    <Suspense fallback={<FullScreenLoader />}>
                        <ProtectedAdminRoutes />
                    </Suspense>
                    </HashRouter>
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