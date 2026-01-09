import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, user, onLogout }) => {
  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title={title}
        user={user}
        onLogout={handleLogout}
        logoutLabel="Cerrar Sesión"
        logoutLabelVisibility="always"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;