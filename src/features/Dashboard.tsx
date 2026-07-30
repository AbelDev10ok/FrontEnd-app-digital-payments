import React from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/shared';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics';
import DashboardMetricCard from '@/features/dashboard/components/DashboardMetricCard';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

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

  console.log("Dashboard renderizado", metrics?.totalActiveClients);


  const cards = [
    {
      label: 'Ventas',
      value: metrics ? metrics.totalSales : 0,
      icon: BarChart3,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Clientes activos',
      value: metrics ? metrics.totalActiveClients : 0,
      icon: Users,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Ingresos totales',
      value: metrics ? formatCurrency(metrics.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Ingresos cobrados',
      value: metrics ? formatCurrency(metrics.totalCollected) : formatCurrency(0),
      icon: CreditCard,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Pendiente por cobrar',
      value: metrics ? formatCurrency(metrics.totalOutstanding) : formatCurrency(0),
      icon: Clock,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Ganancia',
      value: metrics ? formatCurrency(metrics.totalProfit) : formatCurrency(0),
      icon: TrendingUp,
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ];

  return (
    <DashboardLayout title="Dashboard" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">¡Bienvenido de vuelta!</h2>
              <p className="text-indigo-100 text-lg">
                Aquí tienes un resumen de tu actividad reciente
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-4 py-2 rounded-xl bg-white text-sm font-medium text-gray-700 focus:outline-none"
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
                className="px-4 py-2 rounded-xl bg-white text-sm font-medium text-gray-700 focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                onClick={refresh}
                className="inline-flex items-center justify-center px-4 py-2 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition"
                aria-label="Actualizar métricas"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Error al cargar métricas</h3>
              <p className="text-sm text-red-800 font-mono bg-red-100 p-3 rounded">{error}</p>
            </div>
            <div className="text-xs text-red-700">
              <p className="font-semibold mb-2">🔍 Debugging (abre la consola del navegador con F12):</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Busca logs con "[Dashboard]", "[salesService]" o "[clientService]"</li>
                <li>Verifica que los endpoints devuelvan status 200</li>
                <li>El endpoint esperado es: <span className="font-mono bg-red-100 px-1">GET /api/loans/stats?year={year}&month={month}</span></li>
                <li>Y también: <span className="font-mono bg-red-100 px-1">GET /api/clients/stats</span></li>
              </ul>
            </div>
          </div>
        )}

        {!error && loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin">
                <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <span className="text-blue-700">Cargando métricas...</span>
            </div>
          </div>
        )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <DashboardMetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                bgColor={card.bgColor}
                iconColor={card.iconColor}
              />
            ))}
          </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
