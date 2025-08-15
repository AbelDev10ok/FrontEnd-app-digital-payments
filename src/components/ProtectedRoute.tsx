import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ROLE_USER' | 'ROLE_ADMIN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Si es admin tratando de acceder a user, redirigir a admin
    if (user?.role === 'ROLE_ADMIN' && requiredRole === 'ROLE_USER') {
      return <Navigate to="/admin" replace />;
    }
    // Si es user tratando de acceder a admin, redirigir a dashboard
    if (user?.role === 'ROLE_USER' && requiredRole === 'ROLE_ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    // Por defecto redirigir a login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;