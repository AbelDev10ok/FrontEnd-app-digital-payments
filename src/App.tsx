import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import CrearCliente from './pages/CrearCliente';
import ClienteDetalle from './pages/ClienteDetalle';
import Ventas from './pages/Ventas';
import CrearVenta from './pages/CrearVenta';
import VentaDetalle from './pages/VentaDetalle';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import TokenRefreshHandler from './components/TokenRefreshHandler';
import EditarCliente from './pages/EditarCliente';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <TokenRefreshHandler />
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
          
          {/* Rutas protegidas para clientes */}
          <Route
            path="/dashboard/clientes"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clientes/crear"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <CrearCliente />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clientes/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <ClienteDetalle />
              </ProtectedRoute>
            }
          />

                    <Route
            path="/dashboard/clientes/editar/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <EditarCliente />
              </ProtectedRoute>
            }
          />
          
          {/* Rutas protegidas para ventas */}
          <Route
            path="/dashboard/ventas"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <Ventas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ventas/crear"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <CrearVenta />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ventas/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER">
                <VentaDetalle />
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