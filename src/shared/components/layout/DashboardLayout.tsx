import { useState, useEffect, memo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import useNoIndex from '@hooks/useNoIndex';
import { initCurrency } from '@/shared/utils/formatCurrency';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, user, onLogout }) => {

  // console.log('DashboardLayout renderizado');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useNoIndex();

  useEffect(() => {
    document.title = `${title} · Gestión de Cobros y Ventas`;
  }, [title]);

  // Carga la moneda del negocio una sola vez (single-flight) para toda la app
  useEffect(() => {
    initCurrency();
  }, []);

  const handleLogout = () => {
    onLogout();
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Salto al contenido: sin esto la tabulación entra por el menú lateral
          (18 paradas) antes de llegar a la pantalla. Queda fuera del viewport
          por transform, no por `display:none`: sigue en el orden de tabulación
          y un lector de pantalla lo lee. */}
      <a
        href="#contenido-principal"
        onClick={(e) => {
          // El ancla nativa deja el hash en la URL y agrega una entrada al
          // historial (el "Atrás" vuelve al mismo lugar): el foco se mueve
          // igual, y el `href` queda para no depender de JavaScript.
          e.preventDefault();
          document.getElementById('contenido-principal')?.focus();
        }}
        className="absolute left-4 top-4 z-50 -translate-y-24 rounded-input bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-card ring-2 ring-brand-500 transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      {/* Resplandor decorativo como el hero de la landing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60rem_18rem_at_80%_-20%,#d7f2e4_0%,transparent_60%)]"
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="transition-[margin] duration-300 ease-out lg:ml-64 relative">
        <Header
          user={user}
          onLogout={handleLogout}
          showMenuButton
          onMenuToggle={toggleSidebar}
          className="sticky top-0 z-30"
          logoutLabel="Salir"
          logoutLabelVisibility="md"
        />

        {/* Page Content */}
        <main id="contenido-principal" tabIndex={-1} className="p-4 md:p-6 focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default memo(DashboardLayout);
