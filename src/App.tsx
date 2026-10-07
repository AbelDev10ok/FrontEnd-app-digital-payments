import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "@/features/auth/components/Login";
import ProtectedRoute from "@/shared/ProtectedRoute";
import TokenRefreshHandler from "@/shared/TokenRefreshHandler";
import Load from "@/shared/components/feedback/Load";

const Dashboard = lazy(() => import("@/features/dashboard/Dashboard"));
const ClienteDetalle = lazy(
  () => import("@/features/clients/pages/ClienteDetalle"),
);
const AdminPanel = lazy(() => import("@/features/adminPanel/AdminPanel"));
const CrearVenta = lazy(
  () => import("@/features/crearVentas/pages/CrearTransaccion"),
);
const Clientes = lazy(() => import("@/features/clients/pages/Clientes"));
const CrearCliente = lazy(
  () => import("@/features/clients/pages/CrearCliente"),
);
const TodasVentas = lazy(() => import("@/features/ventas/pages/TodasVentas"));
const VentaDetalle = lazy(
  () => import("@/features/ventaDetalle/pages/VentaDetalle"),
);
const EditarVenta = lazy(() => import("@/features/ventas/pages/EditarVenta"));
const EditarCliente = lazy(
  () => import("@/features/clients/pages/EditarCliente"),
);
const Landing = lazy(() => import("@/features/landing/pages/Landing"));
const Precios = lazy(() => import("@/features/landing/pages/Precios"));
const Terminos = lazy(() => import("@/features/landing/pages/Terminos"));
const Privacidad = lazy(() => import("@/features/landing/pages/Privacidad"));
const Register = lazy(
  () => import("@/features/auth/components/Register"),
);
const CobrosDeHoy = lazy(
  () => import("@/features/cobros/pages/CobrosDeHoy"),
);
const Cuotas = lazy(() => import("@/features/cobros/pages/Cuotas"));
const MiNegocio = lazy(() => import("@/features/negocio/pages/MiNegocio"));
const Suscripcion = lazy(
  () => import("@/features/negocio/pages/Suscripcion"),
);
const Productos = lazy(() => import("@/features/catalogo/pages/Productos"));

function App() {
  return (
    <Router>
      <TokenRefreshHandler />
      <div className="App">
        <Suspense fallback={<Load />}>
          <Routes>
            {/* Rutas públicas (landing) */}
            <Route path="/" element={<Landing />} />
            <Route path="/precios" element={<Precios />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/privacidad" element={<Privacidad />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Ruta protegida para usuarios */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={Dashboard}
                />
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
              path="/dashboard/cobros"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={CobrosDeHoy}
                />
              }
            />
            <Route
              path="/dashboard/cuotas"
              element={
                <ProtectedRoute requiredRole="ROLE_USER" component={Cuotas} />
              }
            />
            <Route
              path="/dashboard/negocio"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={MiNegocio}
                />
              }
            />
            <Route
              path="/dashboard/suscripcion"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={Suscripcion}
                />
              }
            />
            <Route
              path="/dashboard/productos"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={Productos}
                />
              }
            />
            <Route
              path="/dashboard/clientes/crear"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={CrearCliente}
                />
              }
            />
            <Route
              path="/dashboard/clientes/:id"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={ClienteDetalle}
                />
              }
            />

            <Route
              path="/dashboard/clientes/editar/:id"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={EditarCliente}
                />
              }
            />

            {/* Rutas estáticas y específicas van primero */}
            <Route
              path="/dashboard/ventas/todas"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={TodasVentas}
                />
              }
            />

            <Route
              path="/dashboard/ventas/crear"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={CrearVenta}
                  componentProps={{ type: "VENTA" }}
                />
              }
            />

            <Route
              path="/dashboard/prestamos/crear"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={CrearVenta}
                  componentProps={{ type: "PRESTAMO" }}
                />
              }
            />

            <Route
              path="/dashboard/ventas/editar/:id"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={EditarVenta}
                />
              }
            />

            {/* La ruta dinámica :id debe ir DESPUÉS de las estáticas para evitar que "todas" o "crear" sean tratados como un ID. */}
            <Route
              path="/dashboard/ventas/:id"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_USER"
                  component={VentaDetalle}
                />
              }
            />

            {/* Ruta protegida para administradores */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  requiredRole="ROLE_ADMIN"
                  component={AdminPanel}
                />
              }
            />

            {/* Ruta para rutas no encontradas */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
