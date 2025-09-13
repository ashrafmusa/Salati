import React from "react";
// FIX: The `react-router-dom` library has module resolution issues in this environment. Changed to a namespace import to resolve "has no exported member" errors.
import * as ReactRouterDOM from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = ReactRouterDOM.useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-primary font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, saving the location they were trying to access
    return (
      <ReactRouterDOM.Navigate to="/login" state={{ from: location }} replace />
    );
  }

  // The mandatory profile completion check has been removed from here
  // to streamline the user flow, especially for checkout.

  return <ReactRouterDOM.Outlet />;
};

export default ProtectedRoute;
