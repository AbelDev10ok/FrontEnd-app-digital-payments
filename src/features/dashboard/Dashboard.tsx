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
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { useDashboardMetrics } from "@/features/dashboard/hooks/useDashboardMetrics";
import { StatCard, Card, Button } from "@/shared/components/ui";
import type { StatTone } from "@/shared/components/ui";
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
}

const kindLabel = (tipo: string) => {
  if (tipo === 'PRESTAMO') return 'Préstamos';
  if (tipo === 'VENTA') return 'Ventas';
  return tipo;
};

const Dashboard: React.FC<PageProps> = ({ user, onLogout }) => {
  const {
    loading,
    error,
    metrics,
    year,
    month,
    setYear,
    setMonth,
    availableYears,
    months,
    refresh,
  } = useDashboardMetrics();

  const cards: MetricCard[] = [
    {
      label: "Ventas",
      value: metrics ? metrics.totalSales : 0,
      icon: BarChart3,
      tone: "brand",
    },
    {
      label: "Clientes activos",
      value: metrics ? metrics.totalActiveClients : 0,
      icon: Users,
      tone: "brand",
    },
    {
      label: "Total vendido",
      value: metrics ? formatCurrency(metrics.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      tone: "brand",
    },
    {
      label: "Ingresos cobrados",
      value: metrics
        ? formatCurrency(metrics.totalCollected)
        : formatCurrency(0),
      icon: CreditCard,
      tone: "success",
    },
    {
      label: "Pendiente por cobrar",
      value: metrics
        ? formatCurrency(metrics.totalOutstanding)
        : formatCurrency(0),
      icon: Clock,
      tone: "warning",
    },
    {
      label: "Ganancia esperada",
      value: metrics ? formatCurrency(metrics.totalProfit) : formatCurrency(0),
      icon: TrendingUp,
      tone: "success",
    },
  ];

  return (
    <DashboardLayout title="Dashboard" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="rounded-card bg-brand-950 p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-300 mb-2">
                Resumen
              </p>
              <h2 className="text-3xl font-display font-bold tracking-tight mb-2">
                ¡Bienvenido de vuelta!
              </h2>
              <p className="text-brand-100/90 text-lg">
                Aquí tienes un resumen de tu actividad reciente
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                aria-label="Filtrar por mes"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                aria-label="Filtrar por año"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error al cargar métricas
                </h3>
                <p className="text-sm text-red-800 font-mono bg-red-100 p-3 rounded">
                  {error}
                </p>
              </div>
              <div className="text-xs text-red-700">
                <p className="font-semibold mb-2">
                  Debugging (abre la consola del navegador con F12):
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verifica que el endpoint devuelva status 200</li>
                  <li>
                    El endpoint esperado es:{" "}
                    <span className="font-mono bg-red-100 px-1">
                      GET /api/loans/dashboard?year={year}&month={month}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {!error && loading && (
          <Card className="p-4 bg-brand-50 border-brand-200">
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
            />
          ))}
        </div>

        {metrics && (
          <>
            <OverdueFeesAlert
              cantidad={metrics.totalOverdueFees}
              monto={metrics.overdueAmount}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-1">
                  Ventas últimos 12 meses
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Monto vendido y cobrado por mes
                </p>
                <MonthlyBarChart series={metrics.monthlySeries} />
                {metrics.productTypeBreakdown.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                    {metrics.productTypeBreakdown.map((entry) => (
                      <div
                        key={entry.tipo}
                        className="bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <p className="text-xs font-medium text-gray-500">
                          {kindLabel(entry.tipo)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                          {formatCurrency(entry.totalVendido)}{" "}
                          <span className="text-xs font-normal text-gray-500">
                            ({entry.totalVentas} ventas)
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-1">
                  Top clientes
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Los que más vendieron en {year}
                </p>
                <TopClientsList clients={metrics.topClients} />
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-display font-bold tracking-tight text-gray-900 mb-4">
                  Estado de ventas
                </h3>
                <SalesStatusBreakdown summary={metrics.statusSummary} />
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
