

import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import FullScreenLoader from './components/FullScreenLoader';
import { ToastProvider } from './contexts/ToastContext';

// --- Lazy-loaded Admin Components ---
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboardScreen = lazy(() => import('./screens/AdminDashboardScreen'));
const AdminOrdersScreen = lazy(() => import('./screens/AdminOrdersScreen'));
const AdminProductsScreen = lazy(() => import('./screens/AdminProductsScreen'));
const AdminCustomersScreen = lazy(() => import('./screens/AdminCustomersScreen'));
const AdminOffersScreen = lazy(() => import('./screens/AdminOffersScreen'));
const AdminDriversScreen = lazy(() => import('./screens/AdminDriversScreen'));
const AdminCategoriesScreen = lazy(() => import('./screens/AdminCategoriesScreen'));
const AdminExtrasScreen = lazy(() => import('./screens/AdminExtrasScreen'));
const AdminSettingsScreen = lazy(() => import('./screens/AdminSettingsScreen'));
const DriverDashboardScreen = lazy(() => import('./screens/DriverDashboardScreen'));


const ProtectedAdminRoutes: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <FullScreenLoader />;
    }

    if (!user || user.role === 'customer') {
        // Redirect to customer app's login page if not any type of admin
        window.location.href = './index.html#/login';
        return null; // Render nothing while redirecting
    }

    // Specific routes for the 'driver' role
    if (user.role === 'driver') {
        return (
            <Routes>
                <Route path="/" element={<DriverDashboardScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }


    return (
        <Routes>
            {/* Routes accessible to all admin levels */}
            <Route path="/" element={<AdminDashboardScreen />} />
            <Route path="/orders" element={<AdminOrdersScreen />} />

            {/* Routes accessible only to 'admin' and 'super-admin' */}
            {(user.role === 'admin' || user.role === 'super-admin') && (
                <>
                    <Route path="/products" element={<AdminProductsScreen />} />
                    <Route path="/users" element={<AdminCustomersScreen />} />
                    <Route path="/offers" element={<AdminOffersScreen />} />
                    <Route path="/drivers" element={<AdminDriversScreen />} />
                </>
            )}

            {/* Routes accessible only to 'super-admin' */}
            {user.role === 'super-admin' && (
                <>
                    <Route path="/categories" element={<AdminCategoriesScreen />} />
                    <Route path="/extras" element={<AdminExtrasScreen />} />
                    <Route path="/settings" element={<AdminSettingsScreen />} />
                </>
            )}

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const AdminApp: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <Suspense fallback={<FullScreenLoader />}>
              <AdminLayout>
                <ProtectedAdminRoutes />
              </AdminLayout>
            </Suspense>
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AdminApp;