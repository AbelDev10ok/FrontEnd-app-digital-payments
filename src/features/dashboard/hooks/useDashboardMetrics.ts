import { useCallback, useEffect, useState } from 'react';
import { salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import type { DashboardStatsDto } from '@/shared/types/dashboard';

export interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  totalProfit: number;
  totalActiveClients: number;
  totalOverdueFees?: number;
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
      const clientStatsPromise = clientService.getClientStats();

      let dashStats: DashboardStatsDto;
      try {
        dashStats = await salesService.getDashboardStats(year, month);
      } catch (err) {
        // Fallback a estadísticas globales si el endpoint específico de mes/año no está disponible.
        try {
          const globalStats = await salesService.getSalesStats();
          dashStats = {
            totalSales: globalStats.totalSales,
            totalRevenue: globalStats.totalRevenue,
            totalCollected: 0,
            totalOutstanding: globalStats.totalOutstanding,
            totalProfit: 0,
            totalOverdueFees: 0,
          };
        } catch {
          throw new Error(`No se pudo obtener estadísticas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
      }

      const clientStats = await clientStatsPromise;

      const merged: DashboardMetrics = {
        totalSales: dashStats.totalSales,
        totalRevenue: dashStats.totalRevenue,
        totalCollected: dashStats.totalCollected,
        totalOutstanding: dashStats.totalOutstanding,
        totalProfit: dashStats.totalProfit,
        totalOverdueFees: dashStats.totalOverdueFees ?? 0,
        totalActiveClients: clientStats.totalActiveClients,
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
