import React from 'react';
// FIX: Corrected react-router-dom import to fix module resolution issue by using a namespace import and destructuring. This can resolve issues where named exports are not correctly recognized by the build tool.
import * as ReactRouterDOM from "react-router-dom";
const { useLocation, Navigate, Outlet } = ReactRouterDOM;
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
            <div className="text-primary font-semibold">Loading...</div>
        </div>
    );
  }

  if (!user) {
    // Redirect to login, saving the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // The mandatory profile completion check has been removed from here
  // to streamline the user flow, especially for checkout.

  return <Outlet />;
};

export default ProtectedRoute;