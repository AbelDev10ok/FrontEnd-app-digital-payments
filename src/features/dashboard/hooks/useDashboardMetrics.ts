import { useCallback, useEffect, useState } from 'react';
import { salesService } from '@/features/ventas/services/salesServices';
import type {
  DashboardAnual,
  MonthlySales,
  ProductTypeSales,
  TopClient,
} from '@/shared/types/dashboard';

export interface SalesStatusSummary {
  completadas: number;
  pendientes: number;
}

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  totalProfit: number;
  totalActiveClients: number;
  totalOverdueFees: number;
  overdueAmount: number;
  statusSummary: SalesStatusSummary;
  anual: DashboardAnual;
  monthlySeries: MonthlySales[];
  topClients: TopClient[];
  productTypeBreakdown: ProductTypeSales[];
}

const getCurrentYear = () => new Date().getFullYear();
const getCurrentMonth = () => new Date().getMonth() + 1; // 0-based

const currentYear = getCurrentYear();
const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

export const useDashboardMetrics = () => {
  const [year, setYear] = useState<number>(getCurrentYear());
  const [month, setMonth] = useState<number>(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dashStats = await salesService.getDashboardStats(year, month);

      const merged: DashboardMetrics = {
        totalSales: dashStats.resumen.totalVentas,
        totalRevenue: dashStats.resumen.totalVendido,
        totalCollected: dashStats.resumen.totalCobrado,
        totalOutstanding: dashStats.resumen.pendientePorCobrar,
        totalProfit: dashStats.resumen.ganancia,
        totalOverdueFees: dashStats.resumen.cuotasVencidas.cantidad,
        overdueAmount: dashStats.resumen.cuotasVencidas.monto,
        statusSummary: {
          completadas: dashStats.resumen.completadas,
          pendientes: dashStats.resumen.pendientes,
        },
        anual: dashStats.anual,
        totalActiveClients: dashStats.clientes.activos,
        monthlySeries: dashStats.serie12Meses,
        topClients: dashStats.topClientes,
        productTypeBreakdown: dashStats.porTipoProducto,
      };

      setMetrics(merged);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar métricas';
      setError(errorMsg);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    loading,
    error,
    metrics,
    year,
    month,
    setYear,
    setMonth,
    availableYears,
    months,
    refresh: fetchMetrics,
  };
};
