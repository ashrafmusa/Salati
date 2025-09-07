
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
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
  
  // If user profile is not complete (missing name, address, OR phone), redirect to profile page.
  if (!user.address || !user.name || user.name === 'عميل جديد' || !user.phone) {
      if (location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
      }
  }

  return <Outlet />;
};

export default ProtectedRoute;
