import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import FullScreenLoader from "./components/FullScreenLoader";

// --- Lazy-loaded Screen Components ---
const MainLayout = lazy(() => import("./components/MainLayout"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const SearchResultsScreen = lazy(() => import("./screens/SearchResultsScreen"));
const ProductDetailScreen = lazy(() => import("./screens/ProductDetailScreen"));
const CartScreen = lazy(() => import("./screens/CartScreen"));
const OrderHistoryScreen = lazy(() => import("./screens/OrderHistoryScreen"));
const CheckoutScreen = lazy(() => import("./screens/CheckoutScreen"));
const OrderSuccessScreen = lazy(() => import("./screens/OrderSuccessScreen"));
const LoginScreen = lazy(() =>
  import("./screens/LoginScreen").then((module) => ({
    default: module.LoginScreen,
  }))
);
const ProfileScreen = lazy(() =>
  import("./screens/ProfileScreen").then((module) => ({
    default: module.ProfileScreen,
  }))
);
const WishlistScreen = lazy(() =>
  import("./screens/WishlistScreen").then((module) => ({
    default: module.WishlistScreen,
  }))
);
const TermsScreen = lazy(() => import("./screens/TermsScreen"));
const PrivacyPolicyScreen = lazy(() => import("./screens/PrivacyPolicyScreen"));

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <HashRouter>
                <Suspense fallback={<FullScreenLoader />}>
                  <div className="animate-slide-in-up">
                    <Routes>
                      {/* The login page is standalone and does not use the main layout. */}
                      <Route path="/login" element={<LoginScreen />} />

                      {/* --- ROUTES WITH MAIN LAYOUT --- */}
                      <Route element={<MainLayout />}>
                        {/* Public routes */}
                        <Route path="/" element={<HomeScreen />} />
                        <Route
                          path="/search"
                          element={<SearchResultsScreen />}
                        />
                        <Route
                          path="/product/:id"
                          element={<ProductDetailScreen />}
                        />
                        <Route path="/terms" element={<TermsScreen />} />
                        <Route
                          path="/privacy"
                          element={<PrivacyPolicyScreen />}
                        />

                        {/* Protected routes */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/cart" element={<CartScreen />} />
                          <Route
                            path="/wishlist"
                            element={<WishlistScreen />}
                          />
                          <Route
                            path="/orders"
                            element={<OrderHistoryScreen />}
                          />
                          <Route path="/profile" element={<ProfileScreen />} />
                          <Route
                            path="/checkout"
                            element={<CheckoutScreen />}
                          />
                        </Route>
                      </Route>

                      {/* The order success page is also standalone. */}
                      <Route
                        path="/order-success/:orderId"
                        element={<OrderSuccessScreen />}
                      />

                      {/* A fallback route to redirect any unknown paths to the home page. */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </Suspense>
              </HashRouter>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
