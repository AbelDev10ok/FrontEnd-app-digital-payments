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
  TrendingUp,
} from "lucide-react";
import { salesService } from "@/features/ventas/services/salesServices";
import { ProductTypeDto, SalesCountsDto } from "@/shared/types/sales";
import { useSalesCountsStore } from "@/features/ventas/store/salesCountsStore";
import { eyebrow, radius } from "@/shared/theme";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onNavigate?: () => void;
}

type SaleKindParam = "VENTA" | "PRESTAMO" | undefined;

type SubmenuLink = { title: string; icon: LucideIcon; path: string };

interface MenuItem {
  title: string;
  icon: LucideIcon;
  hasSubmenu: boolean;
  expanded: boolean;
  onToggle: () => void;
  submenu: SubmenuLink[];
}

const STATUS_OPTIONS: {
  label: string;
  value: string;
  countKey: keyof SalesCountsDto;
}[] = [
  { label: "Todas", value: "Todas", countKey: "total" },
  { label: "A Cobrar", value: "A_COBRAR", countKey: "aCobrar" },
  { label: "Activas", value: "ACTIVE", countKey: "active" },
  { label: "Completadas", value: "COMPLETED", countKey: "completed" },
];

// DESIGN.md: "navegación de 8px"; el hover va en ≤150ms (interacción de alta frecuencia)
const navBase = "px-3 py-2.5 rounded-lg text-sm transition-colors duration-150";
const navIdle = "text-gray-600 hover:bg-gray-50 hover:text-gray-900";
// El estado activo usa el mismo lenguaje que los chips (ring, no sombra)
const navActive = "bg-brand-50 text-brand-700 ring-1 ring-brand-200";

const navLinkClass = (isActive: boolean) =>
  `flex items-center space-x-3 ${navBase} ${isActive ? navActive : navIdle}`;

const subLinkClass = (isActive: boolean) =>
  `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
    isActive
      ? "bg-brand-50/60 text-brand-700 font-medium"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
  }`;

const filterChipClass = (isActive: boolean) =>
  `w-full flex items-center space-x-2 px-3 py-1.5 ${radius.pill} text-xs transition-colors duration-150 ${
    isActive
      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200 font-medium"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
  }`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className={`px-3 pt-3 pb-1 ${eyebrow.hero}`}>
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

  // Los conteos se mueven con cada alta, cobro, anulación o borrado: el store
  // compartido los marca como viejos y este efecto los vuelve a pedir.
  const countsRefreshToken = useSalesCountsStore((state) => state.refreshToken);

  // Los tipos de producto del menú cambian poco: se piden una vez al montar.
  useEffect(() => {
    salesService
      .getProductTypes()
      .then(setProductTypes)
      .catch((err) => console.error("Error fetching product types:", err));
  }, []);

  useEffect(() => {
    let mounted = true;
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
  }, [countsRefreshToken]);

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

  const menuItems = useMemo<MenuItem[]>(
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
        // Los filtros de estado viven acá; "Nueva Venta" ya está en Acciones rápidas.
        submenu: [],
      },
      {
        title: "Préstamos",
        icon: HandCoins,
        hasSubmenu: true,
        expanded: prestamosExpanded,
        onToggle: () => setPrestamosExpanded((prev) => !prev),
        submenu: [],
      },
    ],
    [clientesExpanded, ventasExpanded, prestamosExpanded],
  );

  const renderSubmenuLink = (
    subItem: SubmenuLink,
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
        <subItem.icon strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0" />
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
              <span>{pt.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      aria-label="Menú principal"
      className={`
      fixed left-0 top-0 h-full bg-surface border-r border-gray-100 transition-transform duration-300 motion-reduce:transition-none z-50
      lg:w-64 lg:translate-x-0
      ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
    `}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-dashed border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-action rounded-xl flex items-center justify-center shadow-sm">
              <HandCoins strokeWidth={1.5} className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block font-display font-extrabold tracking-tight text-heading">
                Gestión de Cobros
              </span>
              <span className="block text-[11px] text-gray-500">y Ventas</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-3 space-y-0.5 overflow-y-auto">
          <SectionLabel>Operación</SectionLabel>
          <NavLink
            to="/dashboard"
            end
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <LayoutDashboard strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/dashboard/cobros"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <CalendarClock strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Cobros de hoy</span>
          </NavLink>
          <NavLink
            to="/dashboard/cuotas"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <ListChecks strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Cuotas</span>
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
                      <item.icon strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {/* Cross-fade entre chevrons: ambos en el DOM, uno superpuesto. */}
                    <span aria-hidden="true" className="relative h-4 w-4 flex-shrink-0">
                      <ChevronDown
                        strokeWidth={1.5}
                        className={`h-4 w-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                          item.expanded
                            ? "scale-100 opacity-100 blur-0"
                            : "scale-[0.25] opacity-0 blur-[4px]"
                        }`}
                      />
                      <ChevronRight
                        strokeWidth={1.5}
                        className={`absolute inset-0 h-4 w-4 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                          item.expanded
                            ? "scale-[0.25] opacity-0 blur-[4px]"
                            : "scale-100 opacity-100 blur-0"
                        }`}
                      />
                    </span>
                  </button>

                  {item.submenu && (
                        <div
                          id={`submenu-${index}`}
                          role="menu"
                          aria-hidden={!item.expanded}
                          className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                            item.expanded
                              ? "grid-rows-[1fr] opacity-100 visible"
                              : "grid-rows-[0fr] opacity-0 invisible"
                          }`}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div className="mt-2 ml-6 space-y-0.5 border-l-2 border-gray-100 pl-4">
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
                                  <Package strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-brand-500 transition-colors" />
                                  <span className="font-medium">Categoría</span>
                                  <span aria-hidden="true" className="relative ml-auto block h-3 w-3">
                                    <ChevronDown
                                      strokeWidth={1.5}
                                      className={`h-3 w-3 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                                        productTypesExpanded
                                          ? "scale-100 opacity-100 blur-0"
                                          : "scale-[0.25] opacity-0 blur-[4px]"
                                      }`}
                                    />
                                    <ChevronRight
                                      strokeWidth={1.5}
                                      className={`absolute inset-0 h-3 w-3 transition-[opacity,filter,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
                                        productTypesExpanded
                                          ? "scale-[0.25] opacity-0 blur-[4px]"
                                          : "scale-100 opacity-100 blur-0"
                                      }`}
                                    />
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
                          </div>
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
            <Package strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Productos</span>
          </NavLink>

          <NavLink
            to="/dashboard/vendedores"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <TrendingUp strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Vendedores</span>
          </NavLink>

          <SectionLabel>Acciones rápidas</SectionLabel>
          <NavLink
            to="/dashboard/ventas/crear"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Plus strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Nueva Venta</span>
          </NavLink>
          <NavLink
            to="/dashboard/prestamos/crear"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Plus strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Nuevo Préstamo</span>
          </NavLink>

          <SectionLabel>Configuración</SectionLabel>
          <NavLink
            to="/dashboard/negocio"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <Building2 strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Mi Negocio</span>
          </NavLink>
          <NavLink
            to="/dashboard/suscripcion"
            onClick={onNavigate}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <BadgeCheck strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
            <span>Suscripción</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
