import React, { lazy, Suspense, useState, useEffect } from 'react';
// FIX: Switched to a namespace import for react-router-dom to fix module resolution errors in the build environment.
import * as ReactRouterDOM from 'react-router-dom';
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
// FIX: Changed the lazy import for BundleDetailScreen to assume a default export, which is consistent with other lazy imports in the file and indicated by the build error.
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
      <ReactRouterDOM.HashRouter>
        <ScrollToTop />
        <div className="animate-slide-in-up">
          <ReactRouterDOM.Routes>
            {/* The login page is standalone and does not use the main layout. */}
            <ReactRouterDOM.Route path="/login" element={<Suspense fallback={<FullScreenLoader />}><LoginScreen /></Suspense>} />
            
            {/* --- ROUTES WITH MAIN LAYOUT --- */}
            <ReactRouterDOM.Route element={<MainLayout />}>
              {/* Public routes */}
              <ReactRouterDOM.Route path="/" element={<HomeScreen />} />
              <ReactRouterDOM.Route path="/search" element={<Suspense fallback={<FullScreenLoader />}><SearchResultsScreen /></Suspense>} />
              <ReactRouterDOM.Route path="/bundle/:id" element={<Suspense fallback={<FullScreenLoader />}><BundleDetailScreen /></Suspense>} />
              <ReactRouterDOM.Route path="/item/:id" element={<Suspense fallback={<FullScreenLoader />}><ItemDetailScreen /></Suspense>} />
              <ReactRouterDOM.Route path="/terms" element={<Suspense fallback={<FullScreenLoader />}><TermsScreen /></Suspense>} />
              <ReactRouterDOM.Route path="/privacy" element={<Suspense fallback={<FullScreenLoader />}><PrivacyPolicyScreen /></Suspense>} />

              {/* Protected routes */}
              <ReactRouterDOM.Route element={<ProtectedRoute />}>
                <ReactRouterDOM.Route path="/cart" element={<Suspense fallback={<FullScreenLoader />}><CartScreen /></Suspense>} />
                <ReactRouterDOM.Route path="/wishlist" element={<Suspense fallback={<FullScreenLoader />}><WishlistScreen /></Suspense>} />
                <ReactRouterDOM.Route path="/orders" element={<Suspense fallback={<FullScreenLoader />}><OrderHistoryScreen /></Suspense>} />
                <ReactRouterDOM.Route path="/profile" element={<Suspense fallback={<FullScreenLoader />}><ProfileScreen /></Suspense>} />
                <ReactRouterDOM.Route path="/checkout" element={<Suspense fallback={<FullScreenLoader />}><CheckoutScreen /></Suspense>} />
              </ReactRouterDOM.Route>
            </ReactRouterDOM.Route>
            
            {/* The order success page is also standalone. */}
            <ReactRouterDOM.Route path="/order-success/:orderId" element={<Suspense fallback={<FullScreenLoader />}><OrderSuccessScreen /></Suspense>} />
            
            {/* A fallback route to redirect any unknown paths to the home page. */}
            <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
          </ReactRouterDOM.Routes>
        </div>
      </ReactRouterDOM.HashRouter>
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