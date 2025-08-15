import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Ruta raíz - redirige según autenticación */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                user?.role === 'ROLE_ADMIN' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Ruta protegida para usuarios */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Ruta protegida para administradores */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          
          {/* Ruta para rutas no encontradas */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;