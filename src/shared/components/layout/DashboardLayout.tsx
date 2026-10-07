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
      {/* Resplandor decorativo como el hero de la landing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60rem_18rem_at_80%_-20%,#d7f2e4_0%,transparent_60%)]"
      />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="transition-all duration-300 lg:ml-64 relative">
        <Header
          title={title}
          user={user}
          onLogout={handleLogout}
          showMenuButton
          onMenuToggle={toggleSidebar}
          className="sticky top-0 z-30"
          logoutLabel="Salir"
          logoutLabelVisibility="md"
        />

        {/* Page Content */}
        <main className="p-4 md:p-6">
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
