import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/features/auth/components/Login';
import ProtectedRoute from '@/shared/ProtectedRoute';
import TokenRefreshHandler from '@/shared/TokenRefreshHandler';
import Load from '@/shared/components/feedback/Load';
import { useAuthStore } from '@/features/auth/store/authStore';

const Dashboard = lazy(() => import('@/features/Dashboard'));
const ClienteDetalle = lazy(() => import('@/features/clients/pages/ClienteDetalle'));
const AdminPanel = lazy(() => import('@/features/adminPanel/AdminPanel'));
const CrearVenta = lazy(() => import('@/features/crearVentas/pages/CrearTransaccion'));
const Clientes = lazy(() => import('@/features/clients/pages/Clientes'));
const CrearCliente = lazy(() => import('@/features/clients/pages/CrearCliente'));
const TodasVentas = lazy(() => import('@/features/ventas/pages/TodasVentas'));
const VentaDetalle = lazy(() => import('@/features/ventaDetalle/pages/VentaDetalle'));
const EditarVenta = lazy(() => import('@/features/ventas/pages/EditarVenta'));
const EditarCliente = lazy(() => import('@/features/clients/pages/EditarCliente'));

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <TokenRefreshHandler />
      <div className="App">
        <Suspense fallback={<Load />}>
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
          
          {/* --- RUTAS DE VENTAS (Ordenadas para evitar conflictos) --- */}
          {/* Rutas estáticas y específicas van primero */}
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
            path="/dashboard/ventas/editar/:id"
            element={
              <ProtectedRoute requiredRole="ROLE_USER" component={EditarVenta} />
            }
          />

          {/* La ruta dinámica :id debe ir DESPUÉS de las estáticas para evitar que "todas" o "crear" sean tratados como un ID. */}
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
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
