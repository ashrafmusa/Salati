import React from 'react';
// FIX: The `react-router-dom` components `useLocation`, `Navigate`, and `Outlet` were not found on the namespace import. Changed to a direct import to resolve the errors.
import { useLocation, Navigate, Outlet } from "react-router-dom";
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