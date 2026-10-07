import React, { useState, useMemo, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  HandCoins,
  CalendarClock,
  ListChecks,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { salesService } from "@/features/ventas/services/salesServices";
import { ProductTypeDto, SalesCountsDto } from "@/shared/types/sales";
import { SALE_STATUS_DOT } from "@shared/utils/statusUi";

interface SidebarProps {
  isOpen: boolean;
  onNavigate?: () => void;
}

type SaleKindParam = "VENTA" | "PRESTAMO" | undefined;

const STATUS_OPTIONS: {
  label: string;
  value: string;
  color: string;
  countKey: keyof SalesCountsDto;
}[] = [
  { label: "Todas", value: "Todas", color: "bg-brand-500", countKey: "total" },
  { label: "A Cobrar", value: "A_COBRAR", color: SALE_STATUS_DOT.A_COBRAR, countKey: "aCobrar" },
  { label: "Activas", value: "ACTIVE", color: SALE_STATUS_DOT.ACTIVE, countKey: "active" },
  { label: "Completadas", value: "COMPLETED", color: SALE_STATUS_DOT.COMPLETED, countKey: "completed" },
];

const navBase = "p-3 rounded-lg text-sm transition-colors duration-200";
const navIdle = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
const navActive = "bg-brand-50 text-brand-700 shadow-sm";

const navLinkClass = (isActive: boolean) =>
  `flex items-center space-x-3 ${navBase} ${isActive ? navActive : navIdle}`;

const subLinkClass = (isActive: boolean) =>
  `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
    isActive
      ? "bg-brand-50/60 text-brand-700 font-medium"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
  }`;

const filterChipClass = (isActive: boolean) =>
  `w-full flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs transition-colors duration-150 ${
    isActive
      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200 font-medium"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
  }`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-brand-600">
    {children}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isPrestamosView = useCallback(
    () =>
      location.pathname.includes("/prestamos") ||
      (location.pathname.includes("/ventas/todas") &&
        new URLSearchParams(location.search).get("kind") === "PRESTAMO"),
    [location.pathname, location.search],
  );

  const [clientesExpanded, setClientesExpanded] = useState(() =>
    location.pathname.includes("/clientes"),
  );
  const [ventasExpanded, setVentasExpanded] = useState(
    () => location.pathname.includes("/ventas") && !isPrestamosView(),
  );
  const [prestamosExpanded, setPrestamosExpanded] = useState(isPrestamosView);

  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  const [productTypesExpanded, setProductTypesExpanded] = useState(() => {
    return (
      location.pathname.includes("/ventas") &&
      location.search.includes("productType=")
    );
  });

  const [counts, setCounts] = useState<{
    ventas?: SalesCountsDto;
    prestamos?: SalesCountsDto;
  }>({});

  useEffect(() => {
    let mounted = true;
    salesService
      .getProductTypes()
      .then(setProductTypes)
      .catch((err) => console.error("Error fetching product types:", err));
    salesService
      .getSalesCounts("VENTA")
      .then((c) => mounted && setCounts((prev) => ({ ...prev, ventas: c })))
      .catch(() => {});
    salesService
      .getSalesCounts("PRESTAMO")
      .then((c) => mounted && setCounts((prev) => ({ ...prev, prestamos: c })))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Mantiene abierta la sección correspondiente al navegar; cierra la contraria
  useEffect(() => {
    if (location.pathname.includes("/clientes")) {
      setClientesExpanded(true);
      setVentasExpanded(false);
      setPrestamosExpanded(false);
    } else if (isPrestamosView()) {
      setPrestamosExpanded(true);
      setVentasExpanded(false);
    } else if (location.pathname.includes("/ventas")) {
      setVentasExpanded(true);
      setPrestamosExpanded(false);
    }
  }, [location.pathname, location.search, isPrestamosView]);

  const navigateToSales = (
    kind: SaleKindParam,
    filters: { status?: string; productType?: string },
  ) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (filters.status && filters.status !== "Todas") {
      params.set("status", filters.status);
    }
    if (filters.productType) params.set("productType", filters.productType);

    const qs = params.toString();
    navigate(`/dashboard/ventas/todas${qs ? `?${qs}` : ""}`);
    onNavigate?.();
  };

  const currentSearch = () => new URLSearchParams(location.search);
  const inTodasVentas = location.pathname === "/dashboard/ventas/todas";
  const kindMatches = (kind: SaleKindParam) => {
    const currentKind = currentSearch().get("kind");
    return kind ? currentKind === kind : !currentKind;
  };

  const menuItems = useMemo(
    () => [
      {
        title: "Clientes",
        icon: Users,
        hasSubmenu: true,
        expanded: clientesExpanded,
        onToggle: () => setClientesExpanded((prev) => !prev),
        submenu: [
          {
            title: "Ver Clientes",
            icon: Eye,
            path: "/dashboard/clientes",
          },
          {
            title: "Crear Cliente",
            icon: UserPlus,
            path: "/dashboard/clientes/crear",
          },
        ],
      },
      {
        title: "Ventas",
        icon: ShoppingCart,
        hasSubmenu: true,
        expanded: ventasExpanded,
        onToggle: () => setVentasExpanded((prev) => !prev),
        submenu: [
          {
            title: "Nueva Venta",
            icon: UserPlus,
            path: "/dashboard/ventas/crear",
          },
        ],
      },
      {
        title: "Préstamos",
        icon: HandCoins,
        hasSubmenu: true,
        expanded: prestamosExpanded,
        onToggle: () => setPrestamosExpanded((prev) => !prev),
        submenu: [
          {
            title: "Nuevo Préstamo",
            icon: UserPlus,
            path: "/dashboard/prestamos/crear",
          },
        ],
      },
    ],
    [clientesExpanded, ventasExpanded, prestamosExpanded],
  );

  const renderSubmenuLink = (
    subItem: { title: string; icon: React.FC<{ className?: string }>; path: string },
  ) => {
    const isKindSensitive = subItem.path.startsWith("/dashboard/ventas/todas");
    const expectsKind = subItem.path.includes("kind=PRESTAMO");
    return (
      <NavLink
        key={subItem.title}
        to={subItem.path}
        onClick={onNavigate}
        className={({ isActive }) =>
          subLinkClass(
            isActive &&
              (!isKindSensitive ||
                (expectsKind
                  ? currentSearch().get("kind") === "PRESTAMO"
                  : currentSearch().get("kind") !== "PRESTAMO")),
          )
        }
      >
        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{subItem.title}</span>
      </NavLink>
    );
  };

  const renderStatusFilter = (kind: SaleKindParam) => {
    const sectionCounts = kind === "PRESTAMO" ? counts.prestamos : counts.ventas;
    return (
      <div className="flex flex-col space-y-1 ml-2">
        {STATUS_OPTIONS.map((option) => {
          const isActive =
            inTodasVentas &&
            kindMatches(kind) &&
            (option.value === "Todas"
              ? !currentSearch().get("status")
              : currentSearch().get("status") === option.value);
          const count = sectionCounts?.[option.countKey];
          return (
            <button
              key={option.value}
              onClick={() => navigateToSales(kind, { status: option.value })}
              className={filterChipClass(isActive)}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${option.color}`} />
              <span>{option.label}</span>
              {typeof count === "number" && count > 0 && (
                <span className="ml-auto text-xs font-medium text-gray-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderCategoryFilter = (kind: SaleKindParam) => {
    return (
      <div className="flex flex-col space-y-1 mt-1 ml-2">
        <button
          onClick={() => navigateToSales(kind, { productType: "" })}
          className={filterChipClass(
            inTodasVentas &&
              kindMatches(kind) &&
              !currentSearch().get("productType"),
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          <span>Todas</span>
        </button>
        {productTypes.map((pt) => {
          const isActive =
            inTodasVentas &&
            currentSearch().get("productType") === String(pt.id);
          return (
            <button
              key={pt.id}
              onClick={() =>
                navigateToSales(kind, { productType: String(pt.id) })
              }
              className={filterChipClass(isActive)}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
              <span>{pt.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-100 transition-all duration-300 z-50
      lg:w-64 lg:translate-x-0
      ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
    `}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-dashed border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <HandCoins className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-display font-extrabold tracking-tight text-brand-950">
                Gestión de Cobros
              </span>
              <span className="block text-[11px] text-gray-500">y Ventas</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SectionLabel>Visión general</SectionLabel>
          <NavLink
            to="/dashboard"
            end
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <SectionLabel>Gestión</SectionLabel>
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.hasSubmenu ? (
                <div>
                  <button
                    onClick={item.onToggle}
                    aria-expanded={item.expanded}
                    aria-controls={`submenu-${index}`}
                    className={`w-full flex items-center justify-between ${navBase} ${navIdle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {item.expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {item.expanded && item.submenu && (
                        <div
                          id={`submenu-${index}`}
                          role="menu"
                          aria-hidden={!item.expanded}
                          className={`
                            ml-6 space-y-0.5 border-l-2 border-gray-100 pl-4 overflow-hidden
                            transition-all duration-200 ease-in-out
                            ${item.expanded ? "mt-2 opacity-100" : "mt-0 opacity-0"}
                          `}
                        >
                          {item.submenu.map((subItem) =>
                            renderSubmenuLink(subItem),
                          )}
                          {item.title === "Ventas" && (
                            <>
                              <div className="pt-1">{renderStatusFilter(undefined)}</div>
                              <div className="pt-2 mt-2 border-t border-gray-100">
                                <button
                                  onClick={() =>
                                    setProductTypesExpanded((prev) => !prev)
                                  }
                                  aria-expanded={productTypesExpanded}
                                  className={`${filterChipClass(false)} group`}
                                >
                                  <Package className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-brand-500 transition-colors" />
                                  <span className="font-medium">Categoría</span>
                                  <span className="ml-auto">
                                    {productTypesExpanded ? (
                                      <ChevronDown className="w-3 h-3" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" />
                                    )}
                                  </span>
                                </button>
                                {productTypesExpanded &&
                                  renderCategoryFilter(undefined)}
                              </div>
                            </>
                          )}
                          {item.title === "Préstamos" && (
                            <div className="pt-1">
                              {renderStatusFilter("PRESTAMO")}
                            </div>
                          )}
                        </div>
                      )}
                </div>
              ) : null}
            </div>
          ))}

          <SectionLabel>Catálogo</SectionLabel>
          <NavLink
            to="/dashboard/productos"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Package className="w-4 h-4 flex-shrink-0" />
            <span>Productos</span>
          </NavLink>

          <SectionLabel>Operación</SectionLabel>
          <NavLink
            to="/dashboard/cobros"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <CalendarClock className="w-4 h-4 flex-shrink-0" />
            <span>Cobros de hoy</span>
          </NavLink>
          <NavLink
            to="/dashboard/cuotas"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <ListChecks className="w-4 h-4 flex-shrink-0" />
            <span>Cuotas</span>
          </NavLink>

          <SectionLabel>Acciones rápidas</SectionLabel>
          <NavLink
            to="/dashboard/ventas/crear"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Nueva Venta</span>
          </NavLink>
          <NavLink
            to="/dashboard/prestamos/crear"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Nuevo Préstamo</span>
          </NavLink>

          <SectionLabel>Configuración</SectionLabel>
          <NavLink
            to="/dashboard/negocio"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span>Mi Negocio</span>
          </NavLink>
          <NavLink
            to="/dashboard/suscripcion"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <BadgeCheck className="w-4 h-4 flex-shrink-0" />
            <span>Suscripción</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
