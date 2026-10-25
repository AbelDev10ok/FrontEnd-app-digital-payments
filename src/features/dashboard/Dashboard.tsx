import { useMemo, type ReactNode } from "react";
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Clock,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import {
  formatCurrency,
  formatMoneyByCurrency,
  getCurrency,
} from "@/shared/utils/formatCurrency";
import { MONEDAS_SOPORTADAS, esMonedaSoportada } from "@/shared/utils/currencies";
import {
  useDashboardMetrics,
  TODAS,
} from "@/features/dashboard/hooks/useDashboardMetrics";
import { StatCard, Card, Button, ButtonLink, Select } from "@/shared/components/ui";
import type { StatTone } from "@/shared/components/ui";
import type { MontosPorMoneda } from "@/shared/types/money";
import {
  AnnualSummary,
  MonthlyBarChart,
  OverdueFeesAlert,
  SalesStatusBreakdown,
  TopClientsList,
} from "@/features/dashboard/components";

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

interface MetricCard {
  label: string;
  value: string | number;
  icon: typeof BarChart3;
  tone: StatTone;
  /** Alcance del indicador (a hoy / del mes): sin esto el número se malinterpreta */
  footnote?: ReactNode;
}

const kindLabel = (tipo: string) => {
  if (tipo === 'PRESTAMO') return 'Préstamos';
  if (tipo === 'VENTA') return 'Ventas';
  return tipo;
};

// Los indicadores por moneda nunca combinan monedas distintas: cada uno se
// calcula con sus propios montos y se muestran juntos con su moneda.

const variacionPorMoneda = (actual: MontosPorMoneda = {}, previo: MontosPorMoneda = {}): string => {
  const monedas = [...new Set([...Object.keys(actual), ...Object.keys(previo)])].sort();
  if (monedas.length === 0) return "—";
  return monedas
    .map((moneda) => {
      const base = previo[moneda] ?? 0;
      const valor = actual[moneda] ?? 0;
      const sufijo = monedas.length > 1 ? `${moneda}: ` : "";
      if (base === 0) return valor > 0 ? `${sufijo}nuevo` : `${sufijo}0%`;
      const pct = Math.round(((valor - base) / base) * 100);
      return `${sufijo}${pct >= 0 ? "+" : ""}${pct}%`;
    })
    .join(" · ");
};

/**
 * Frase que respalda la variación con los montos crudos: así el porcentaje no
 * queda huérfano ("Pasaste de $150.000 en septiembre a $168.000 en octubre").
 */
const detalleVariacionPorMoneda = (
  actual: MontosPorMoneda = {},
  previo: MontosPorMoneda = {},
  mesAnterior: string,
  mesActual: string,
): string => {
  const monedas = [...new Set([...Object.keys(actual), ...Object.keys(previo)])].sort();
  if (monedas.length === 0) return `Sin ventas en ${mesActual}.`;
  if (!monedas.some((moneda) => (previo[moneda] ?? 0) > 0)) {
    return `En ${mesAnterior} no hubo ventas.`;
  }
  if (monedas.length > 1) {
    return monedas
      .map((moneda) => {
        const base = previo[moneda] ?? 0;
        if (base <= 0) return `${moneda}: sin ventas en ${mesAnterior}`;
        return `${moneda}: ${formatCurrency(base, moneda)} → ${formatCurrency(actual[moneda] ?? 0, moneda)}`;
      })
      .join(" · ");
  }
  const moneda = monedas[0];
  return `Pasaste de ${formatCurrency(previo[moneda] ?? 0, moneda)} en ${mesAnterior} a ${formatCurrency(actual[moneda] ?? 0, moneda)} en ${mesActual}.`;
};

// El promedio por operación divide montos por cantidades: solo es honesto con
// una sola moneda en juego (las cantidades no están desglosadas por moneda).
const promedioPorOperacion = (
  vendido: MontosPorMoneda = {},
  operaciones: number,
): string | null => {
  const monedas = Object.keys(vendido);
  if (operaciones <= 0 || monedas.length !== 1) return null;
  return formatCurrency(vendido[monedas[0]] / operaciones, monedas[0]);
};

/** Frase que explica el promedio por operación (o por qué no se puede calcular). */
const detallePromedio = (
  vendido: MontosPorMoneda = {},
  operaciones: number,
  mesActual: string,
): string => {
  const monedas = Object.keys(vendido);
  if (monedas.length > 1) {
    return "Con monedas mezcladas no se puede promediar; elegí una moneda arriba.";
  }
  if (operaciones <= 0) {
    return `Este mes (${mesActual}) todavía no registraste operaciones.`;
  }
  if (monedas.length === 0) {
    return `No hay monto facturado para promediar en ${mesActual}.`;
  }
  const moneda = monedas[0];
  return `${operaciones} ${operaciones === 1 ? "operación" : "operaciones"} en ${mesActual}, ${formatCurrency(vendido[moneda], moneda)} facturados.`;
};

const Dashboard: React.FC<PageProps> = ({ user, onLogout }) => {
  const {
    loading,
    error,
    metrics,
    year,
    month,
    currency,
    setYear,
    setMonth,
    setCurrency,
    availableYears,
    months,
    refresh,
  } = useDashboardMetrics();

  // Opciones del selector: solo las monedas soportadas (ARS/USD), más la del
  // negocio si es un dato legado fuera de la lista y tiene datos en esa moneda
  // (no se deja historial inaccesible). La selección actual siempre entra como
  // opción para que el <select> nunca quede vacío (p. ej. un link viejo con
  // ?moneda=PYG).
  const opcionesMoneda = useMemo(() => {
    const opciones = new Set<string>(MONEDAS_SOPORTADAS);
    const delNegocio = getCurrency().toUpperCase();
    const disponibles = metrics?.monedasDisponibles ?? [];
    if (delNegocio && !esMonedaSoportada(delNegocio) && disponibles.includes(delNegocio)) {
      opciones.add(delNegocio);
    }
    if (currency !== TODAS) opciones.add(currency);
    return [...opciones].sort();
  }, [metrics?.monedasDisponibles, currency]);

  const mesLabel = months.find((m) => m.value === month)?.label ?? "";
  const fechaAnterior = new Date(year, month - 2, 1);
  const mesAnteriorLabel = months.find((m) => m.value === fechaAnterior.getMonth() + 1)?.label ?? "";
  const serieMes = metrics?.monthlySeries.find((m) => m.year * 100 + m.month === year * 100 + month);
  const serieMesAnterior = metrics?.monthlySeries.find(
    (m) => m.year * 100 + m.month === fechaAnterior.getFullYear() * 100 + (fechaAnterior.getMonth() + 1),
  );

  // El promedio divide el facturado (sin canceladas) por las operaciones sin
  // cancelar, para que numerador y denominador cuenten lo mismo.
  const operacionesValidas = metrics
    ? Math.max(metrics.totalSales - metrics.statusSummary.canceladas, 0)
    : 0;
  const promedio = metrics ? promedioPorOperacion(metrics.totalRevenue, operacionesValidas) : null;
  const sinDatos = !!metrics && metrics.totalSales === 0 && metrics.totalClients === 0;

  const cards: MetricCard[] = [
    {
      label: "Operaciones",
      value: metrics ? metrics.totalSales : "—",
      icon: BarChart3,
      tone: "brand",
    },
    {
      label: "Clientes activos",
      value: metrics ? metrics.totalActiveClients : "—",
      icon: Users,
      tone: "brand",
    },
    {
      label: "Total vendido",
      value: metrics ? formatMoneyByCurrency(metrics.totalRevenue) || formatCurrency(0) : "—",
      icon: DollarSign,
      tone: "brand",
    },
    {
      label: "Ingresos cobrados",
      value: metrics ? formatMoneyByCurrency(metrics.totalCollected) || formatCurrency(0) : "—",
      icon: CreditCard,
      tone: "success",
    },
    {
      label: "Pendiente por cobrar",
      value: metrics ? formatMoneyByCurrency(metrics.totalOutstanding) || formatCurrency(0) : "—",
      icon: Clock,
      tone: "warning",
      footnote: "a hoy, todas las operaciones",
    },
    {
      label: "Ganancia estimada",
      value: metrics ? formatMoneyByCurrency(metrics.totalProfit) || formatCurrency(0) : "—",
      icon: TrendingUp,
      tone: "success",
      footnote: `de las operaciones de ${mesLabel.toLowerCase()}`,
    },
  ];

  return (
    <DashboardLayout title="Dashboard" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="rounded-card bg-brand-950 p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-display font-bold tracking-tight mb-2 truncate">
                ¡Hola{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
              </h1>
              <p className="text-brand-100/90 text-lg">
                Actividad de tu negocio, mes a mes
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                aria-label="Filtrar por año"
                className="sm:w-auto text-gray-900 shadow-sm"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <Select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                aria-label="Filtrar por mes"
                className="sm:w-auto text-gray-900 shadow-sm"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-label="Filtrar por moneda"
                className="sm:w-auto text-gray-900 shadow-sm"
              >
                <option value={TODAS}>Todas las monedas</option>
                {opcionesMoneda.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <Button
                onClick={refresh}
                variant="secondary"
                aria-label="Actualizar métricas"
                leftIcon={<RefreshCw className="w-5 h-5" />}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="p-6 bg-red-50 border-red-200" role="alert">
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              No pudimos cargar las métricas
            </h3>
            <p className="text-sm text-red-800 mb-4">{error}</p>
            <Button
              onClick={refresh}
              variant="secondary"
              leftIcon={<RefreshCw className="w-5 h-5" />}
            >
              Reintentar
            </Button>
          </Card>
        )}

        {!error && loading && !metrics && (
          <Card className="p-4 bg-brand-50 border-brand-200" role="status">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-brand-600 animate-spin" />
              <span className="text-brand-700">Cargando métricas...</span>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={<card.icon className="w-6 h-6" />}
              tone={card.tone}
              footnote={card.footnote}
            />
          ))}
        </div>

        {sinDatos && (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-2">
              Todavía no hay actividad
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Registrá tu primera venta o préstamo para empezar a ver tus métricas.
            </p>
            <ButtonLink to="/dashboard/ventas/crear" variant="primary">
              Crear operación
            </ButtonLink>
          </Card>
        )}

        {metrics && (
          <>
            <OverdueFeesAlert
              cantidad={metrics.totalOverdueFees}
              monto={metrics.overdueAmount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-1">
                  Operaciones últimos 12 meses
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Monto vendido y cobrado por mes, hasta {mesLabel} {year}
                </p>
                <MonthlyBarChart series={metrics.monthlySeries} />
                {metrics.productTypeBreakdown.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Del mes, por tipo de operación
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {metrics.productTypeBreakdown.map((entry) => (
                        <div
                          key={entry.tipo}
                          className="bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <p className="text-xs font-medium text-gray-500">
                            {kindLabel(entry.tipo)}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                            {formatMoneyByCurrency(entry.totalVendido)}{" "}
                            <span className="text-xs font-normal text-gray-500">
                              ({entry.totalVentas} operaciones)
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-1">
                  Top clientes
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Con más operaciones en {year}
                </p>
                <TopClientsList clients={metrics.topClients} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">
                  Estado del mes
                </h3>
                <SalesStatusBreakdown summary={metrics.statusSummary} />
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">Reembolsos</span>
                    <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                      {formatMoneyByCurrency(metrics.refunds) || formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">Clientes en total</span>
                    <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                      {metrics.totalClients}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">
                  Indicadores del mes
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">Ventas vs mes anterior</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                        {variacionPorMoneda(serieMes?.vendido, serieMesAnterior?.vendido)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {detalleVariacionPorMoneda(
                        serieMes?.vendido,
                        serieMesAnterior?.vendido,
                        mesAnteriorLabel,
                        mesLabel,
                      )}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-500">Promedio por operación</span>
                      <span className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                        {promedio ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {detallePromedio(metrics.totalRevenue, operacionesValidas, mesLabel)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">
                  Resumen anual {year}
                </h3>
                <AnnualSummary anual={metrics.anual} />
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
