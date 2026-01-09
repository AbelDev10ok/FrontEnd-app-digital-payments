import React from 'react';
import { LogOut, User, Shield, Menu } from 'lucide-react';

interface UserShape {
  email?: string;
  role?: string;
}

interface HeaderProps {
  title: string;
  user?: UserShape | null;
  onLogout: () => void;
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
  subtitle?: string;
  logoutLabel?: string;
  logoutLabelVisibility?: 'always' | 'md';
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onLogout,
  showMenuButton = false,
  onMenuToggle,
  subtitle,
  logoutLabel = 'Cerrar Sesión',
  logoutLabelVisibility = 'always',
  className = '',
}) => {
  const roleLabel = user?.role === 'ROLE_ADMIN' ? 'Administrador' : 'Usuario';
  const autoSubtitle = subtitle ?? (user?.role === 'ROLE_ADMIN' ? 'Panel de Administración' : 'Panel de Usuario');

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {showMenuButton && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}

            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                {user?.role === 'ROLE_ADMIN' ? (
                  <Shield className="w-6 h-6 text-white" />
                ) : (
                  <User className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500 hidden sm:block">{autoSubtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <User className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 md:px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              {logoutLabelVisibility === 'always' ? (
                <span className="ml-1">{logoutLabel}</span>
              ) : (
                <span className="hidden md:inline">{logoutLabel}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
