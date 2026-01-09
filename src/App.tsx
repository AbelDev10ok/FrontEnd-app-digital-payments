import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './features/auth/components/Login';
import Dashboard from './features/Dashboard';

import ClienteDetalle from './features/clients/pages/ClienteDetalle';
import AdminPanel from './features/adminPanel/AdminPanel';
import ProtectedRoute from './shared/ProtectedRoute';
import TokenRefreshHandler from './shared/TokenRefreshHandler';

// import TodasLasVentas from './pages/ventas/Cobrar';
// import VentasACobrarHoy from './pages/ventas/Todas';
import CrearVenta from './features/crearVentas/pages/CrearTransaccion';
import VentasACobrar from './features/ventas/pages/VentasACobrar';
import { useAuthStore } from './features/auth/store/authStore';
import Clientes from './features/clients/pages/Clientes';
import CrearCliente from './features/clients/pages/CrearCliente';
import Ventas from './pages/ventas/Ventas';
import TodasVentas from './features/ventas/pages/TodasVentas';
import VentaDetalle from './features/ventaDetalle/pages/VentaDetalle';
import EditarCliente from './features/clients/pages/EditarCliente';



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
              <ProtectedRoute requiredRole="ROLE_USER" component={Dashboard} />
            }
          />
          
          {/* Rutas protegidas para clientes */}
          <Route
            path="/dashboard/clientes"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={Clientes} />
            }
          />
          <Route
            path="/dashboard/clientes/crear"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={CrearCliente} />
            }
          />
          <Route
            path="/dashboard/clientes/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={ClienteDetalle} />
            }
          />

          <Route
            path="/dashboard/clientes/editar/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={EditarCliente} />
            }
          />
          
          {/* Rutas protegidas para ventas - mantenemos compatibilidad */}
          <Route
            path="/dashboard/ventas"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={Ventas} />
            }
          />
          
          {/* Nuevas rutas específicas para ventas */}
          <Route
            path="/dashboard/ventas/cobrar-hoy"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={VentasACobrar} />
            }
          />
          <Route
            path="/dashboard/ventas/todas"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={TodasVentas} />
            }
          />
          
          <Route
            path="/dashboard/ventas/crear"
            element={
              <ProtectedRoute
                requiredRole="ROLE_USER"
                component={CrearVenta}
                componentProps={{ type: 'VENTA' }}
              />
            }
          />
          
          <Route
            path="/dashboard/ventas/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={VentaDetalle} />
            }
          />
          
          {/* Ruta protegida para administradores */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ROLE_ADMIN" component={AdminPanel} />
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
