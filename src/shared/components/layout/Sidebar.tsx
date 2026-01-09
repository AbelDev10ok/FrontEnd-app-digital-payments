import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  ChevronDown, 
  ChevronRight,
  UserPlus,
  Eye,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const [clientesExpanded, setClientesExpanded] = useState(false);
  const [ventasExpanded, setVentasExpanded] = useState(false);

  const menuItems = useMemo(() => [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      exact: true
    },
    {
      title: 'Clientes',
      icon: Users,
      hasSubmenu: true,
      expanded: clientesExpanded,
      onToggle: () => setClientesExpanded(!clientesExpanded),
      submenu: [
        {
          title: 'Ver Clientes',
          icon: Eye,
          path: '/dashboard/clientes'
        },
        {
          title: 'Crear Cliente',
          icon: UserPlus,
          path: '/dashboard/clientes/crear', 
        }
      ]
    },
    {
      title: 'Ventas',
      icon: ShoppingCart,
      hasSubmenu: true,
      expanded: ventasExpanded,
      onToggle: () => setVentasExpanded(!ventasExpanded),
      submenu: [
        {
          title: 'Ventas a cobrar',
          icon: Eye,
          path: '/dashboard/ventas/cobrar-hoy',
        },
        {
          title: 'Todas las Ventas',
          icon: Eye,
          path: '/dashboard/ventas/todas'
        },
      ]
    },
    {
      title: 'Nueva Venta',
      icon: Plus,
      path: '/dashboard/ventas/crear'
    }
  ], [clientesExpanded, ventasExpanded]);

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-40
      lg:w-64 lg:translate-x-0
      ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
    `}>
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Mi Sistema</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={item.onToggle}
                    aria-expanded={item.expanded}
                    aria-controls={`submenu-${index}`}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.expanded ?
                      <ChevronDown className="w-4 h-4" /> :
                      <ChevronRight className="w-4 h-4" />
                    }
                  </button>
                  
                  {/* Submenu */}
                  {item.expanded && item.submenu && (
                    <div id={`submenu-${index}`} role="menu" aria-hidden={!item.expanded} className="ml-6 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
                      {item.submenu.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          className={({ isActive }) => `
                            flex items-center space-x-3 p-3 rounded-lg text-sm transition-colors duration-200
                            ${isActive 
                              ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <subItem.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{subItem.title}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path ?? '#'}
                  end={item.exact}
                  className={({ isActive }) => `
                    flex items-center space-x-3 p-3 rounded-xl transition-colors duration-200
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
