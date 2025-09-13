import React, { lazy, Suspense, useState, useEffect } from 'react';
// FIX: The `react-router-dom` components were not found on the namespace import. Changed to a direct import of `Routes`, `Route`, `Navigate`, and `HashRouter` to resolve the errors.
import { Routes, Route, Navigate, HashRouter } from "react-router-dom";
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { SettingsProvider } from './contexts/SettingsContext';
import FullScreenLoader from './components/FullScreenLoader';
import { initializeFirebase } from './firebase/config';
import ScrollToTop from './components/ScrollToTop';
import ThemeApplicator from './components/ThemeApplicator';
import ConfigurationChecker from './components/ConfigurationChecker';
import { useAuth } from './hooks/useAuth';
import WelcomeModal from './components/WelcomeModal';

// Statically import components critical for the initial page load (LCP)
import MainLayout from './components/MainLayout';
import HomeScreen from './screens/HomeScreen';
import ProtectedRoute from './components/ProtectedRoute'; // <-- STATIC IMPORT

// --- Lazy-loaded Screen Components ---
const SearchResultsScreen = lazy(() => import('./screens/SearchResultsScreen'));
const BundleDetailScreen = lazy(() => import('./screens/BundleDetailScreen'));
const ItemDetailScreen = lazy(() => import('./screens/ItemDetailScreen'));
const CartScreen = lazy(() => import('./screens/CartScreen'));
const OrderHistoryScreen = lazy(() => import('./screens/OrderHistoryScreen'));
const CheckoutScreen = lazy(() => import('./screens/CheckoutScreen'));
const OrderSuccessScreen = lazy(() => import('./screens/OrderSuccessScreen'));
const LoginScreen = lazy(() => import('./screens/LoginScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const WishlistScreen = lazy(() => import('./screens/WishlistScreen'));
const TermsScreen = lazy(() => import('./screens/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/PrivacyPolicyScreen'));

const AppContent: React.FC = () => {
  const { user, showWelcomeModal, setShowWelcomeModal } = useAuth();

  return (
    <>
      <ThemeApplicator />
      <HashRouter>
        <ScrollToTop />
        <div className="animate-slide-in-up">
          <Routes>
            {/* The login page is standalone and does not use the main layout. */}
            <Route path="/login" element={<Suspense fallback={<FullScreenLoader />}><LoginScreen /></Suspense>} />
            
            {/* --- ROUTES WITH MAIN LAYOUT --- */}
            <Route element={<MainLayout />}>
              {/* Public routes */}
              <Route path="/" element={<HomeScreen />} />
              <Route path="/search" element={<Suspense fallback={<FullScreenLoader />}><SearchResultsScreen /></Suspense>} />
              <Route path="/bundle/:id" element={<Suspense fallback={<FullScreenLoader />}><BundleDetailScreen /></Suspense>} />
              <Route path="/item/:id" element={<Suspense fallback={<FullScreenLoader />}><ItemDetailScreen /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<FullScreenLoader />}><TermsScreen /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<FullScreenLoader />}><PrivacyPolicyScreen /></Suspense>} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/cart" element={<Suspense fallback={<FullScreenLoader />}><CartScreen /></Suspense>} />
                <Route path="/wishlist" element={<Suspense fallback={<FullScreenLoader />}><WishlistScreen /></Suspense>} />
                <Route path="/orders" element={<Suspense fallback={<FullScreenLoader />}><OrderHistoryScreen /></Suspense>} />
                <Route path="/profile" element={<Suspense fallback={<FullScreenLoader />}><ProfileScreen /></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<FullScreenLoader />}><CheckoutScreen /></Suspense>} />
              </Route>
            </Route>
            
            {/* The order success page is also standalone. */}
            <Route path="/order-success/:orderId" element={<Suspense fallback={<FullScreenLoader />}><OrderSuccessScreen /></Suspense>} />
            
            {/* A fallback route to redirect any unknown paths to the home page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
      {showWelcomeModal && user && <WelcomeModal user={user} onClose={() => setShowWelcomeModal(false)} />}
    </>
  );
}


const App: React.FC = () => {
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
              <ConfigurationChecker>
                <AppContent />
              </ConfigurationChecker>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;