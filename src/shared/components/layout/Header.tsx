import React from "react";
import { LogOut, User, Menu } from "lucide-react";

interface UserShape {
  email?: string;
  role?: string;
}

interface HeaderProps {
  user?: UserShape | null;
  onLogout: () => void;
  showMenuButton?: boolean;
  onMenuToggle?: () => void;
  logoutLabel?: string;
  logoutLabelVisibility?: "always" | "md";
  className?: string;
}

/**
 * Barra superior mínima: menú en móvil, identidad de la cuenta y salida.
 * El título de la página vive una sola vez, en su PageHeader (DESIGN.md:
 * "Display" 24px), así que acá no se repite ni se agrega un subtítulo genérico.
 */
const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  showMenuButton = false,
  onMenuToggle,
  logoutLabel = "Cerrar Sesión",
  logoutLabelVisibility = "always",
  className = "",
}) => {
  const roleLabel = user?.role === "ROLE_ADMIN" ? "Administrador" : "Usuario";

  return (
    <header
      className={`border-b border-gray-100 bg-white/85 backdrop-blur ${className}`}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2 md:px-6">
        {showMenuButton ? (
          <button
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        ) : (
          <span aria-hidden="true" />
        )}

        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="flex items-center justify-center w-9 h-9 bg-brand-600 rounded-xl shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <button
            onClick={onLogout}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 md:px-4"
          >
            <LogOut className="w-4 h-4 md:mr-2" />
            {logoutLabelVisibility === "always" ? (
              <span className="ml-1">{logoutLabel}</span>
            ) : (
              <span className="hidden md:inline">{logoutLabel}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
