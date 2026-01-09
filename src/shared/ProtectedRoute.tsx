/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthStore } from '@/features/auth';
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  component?: React.ComponentType<any>;
  componentProps?: Record<string, any>;
  requiredRole?: 'ROLE_USER' | 'ROLE_ADMIN';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, component: Component, componentProps, requiredRole }) => {
  const { isAuthenticated, user, logout } = useAuthStore();

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

  // If a component is provided, create it with injected auth props
  if (Component) {
    return <Component {...componentProps} user={user} onLogout={logout} />;
  }

  // Forward auth info to the single child element if possible
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { user, onLogout: logout });
  }

  return <>{children}</>;
};

export default ProtectedRoute;