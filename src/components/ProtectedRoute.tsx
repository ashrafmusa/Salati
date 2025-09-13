import React from 'react';
// FIX: Switched to a namespace import for react-router-dom to fix module resolution errors in the build environment.
import * as ReactRouterDOM from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

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
    return <ReactRouterDOM.Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // The mandatory profile completion check has been removed from here
  // to streamline the user flow, especially for checkout.

  return <ReactRouterDOM.Outlet />;
};

export default ProtectedRoute;