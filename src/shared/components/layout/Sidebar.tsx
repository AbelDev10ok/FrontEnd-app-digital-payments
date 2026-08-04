import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  ChevronDown, 
  ChevronRight,
  UserPlus,
  Eye,
  Plus,
  Package,
} from 'lucide-react';
import { salesService } from '@/features/ventas/services/salesServices';
import { ProductTypeDto } from '@/shared/types/sales';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [clientesExpanded, setClientesExpanded] = useState(() => location.pathname.includes('/clientes'));
  const [ventasExpanded, setVentasExpanded] = useState(() => location.pathname.includes('/ventas'));

  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [productTypesExpanded, setProductTypesExpanded] = useState(() => {
    return location.pathname.includes('/ventas') && location.search.includes('productType=');
  });

  useEffect(() => {
    salesService.getProductTypes()
      .then(setProductTypes)
      .catch(err => console.error("Error fetching product types:", err));
  }, []);

  const filterOptions = [
    { label: 'Todos', value: 'Todos', color: 'bg-indigo-500' },
    { label: 'A Cobrar', value: 'A_COBRAR', color: 'bg-red-500' },
    { label: 'Completadas', value: 'COMPLETED', color: 'bg-green-500' },
    { label: 'Activas', value: 'ACTIVE', color: 'bg-yellow-500' }
    ];

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
      submenu: []
    },
    {
      title: 'Nueva Venta',
      icon: Plus,
      path: '/dashboard/ventas/crear'
    }
  ], [clientesExpanded, ventasExpanded]);

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-50
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
                      {/* Filtros (estate) */}
                      {item.title === 'Ventas' && (
                        <div className="mt-1">
                            <div className="flex flex-col space-y-1 ml-2">
                              {filterOptions.map(option => {
                                const isActive = (() => {
                                  const search = new URLSearchParams(location.search);
                                  const current = search.get('status');
                                  if (option.value === 'Todos') {
                                    return (
                                      location.pathname === '/dashboard/ventas/todas' && !current
                                    );
                                  }
                                  return (
                                    location.pathname === '/dashboard/ventas/todas' &&
                                    current === option.value
                                  );
                                })();

                                return (
                                  <button
                                    key={option.value}
                                    onClick={() => {
                                      if (option.value === 'Todos') {
                                        navigate('/dashboard/ventas/todas');
                                      } else {
                                        navigate(`/dashboard/ventas/todas?status=${option.value}`);
                                      }
                                      // Mantenemos el menú abierto para mejor UX
                                      if (!ventasExpanded) setVentasExpanded(true);
                                    }}
                                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150
                                      ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                      }`}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                          {/* Filtros de Tipos de Producto */}
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => setProductTypesExpanded(!productTypesExpanded)}
                              className="w-full flex items-center justify-between p-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200 group"
                            >
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                <span className="font-medium">Categoria</span>
                              </div>
                              {productTypesExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>
                            {productTypesExpanded && (
                              <div className="flex flex-col space-y-1 mt-1 ml-2">
                                <button
                                  onClick={() => {
                                    navigate('/dashboard/ventas/todas');
                                    if (!ventasExpanded) setVentasExpanded(true);
                                  }}
                                  className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                                    location.pathname === '/dashboard/ventas/todas' && !new URLSearchParams(location.search).get('productType')
                                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                                  <span>Todos</span>
                                </button>
                                {productTypes.map(pt => {
                                  const isActive = new URLSearchParams(location.search).get('productType') === String(pt.id);
                                  return (
                                    <button
                                      key={pt.id}
                                      onClick={() => {
                                        navigate(`/dashboard/ventas/todas?productType=${pt.id}`);
                                        if (!ventasExpanded) setVentasExpanded(true);
                                      }}
                                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                                        isActive
                                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                      }`}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                      <span>{pt.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
