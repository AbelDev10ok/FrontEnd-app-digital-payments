import { useCallback, useEffect, useMemo, useState } from 'react';
import { salesService } from '@/features/ventas/services/salesServices';
import { clientService } from '@/features/clients/services/clientServices';
import type { DashboardStatsDto } from '@/types/dashboard';

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
      console.log('📊 [Dashboard] Iniciando fetch de métricas', { year, month });
      
      const clientStatsPromise = clientService.getClientStats()
        .then(stats => {
          console.log('✅ [Dashboard] Client stats recibidos:', stats);
          return stats;
        })
        .catch(err => {
          console.error('❌ [Dashboard] Error en getClientStats:', err);
          throw err;
        });

      let dashStats: DashboardStatsDto;
      try {
        console.log(`📊 [Dashboard] Intentando getDashboardStats(${year}, ${month})`);
        dashStats = await salesService.getDashboardStats(year, month);
        console.log('✅ [Dashboard] DashboardStats recibidos:', dashStats);
      } catch (err) {
        console.warn('⚠️ [Dashboard] Error en getDashboardStats, intentando fallback:', err);
        // Fallback a estadísticas globales si el endpoint específico de mes/año no está disponible.
        try {
          const globalStats = await salesService.getSalesStats();
          console.log('✅ [Dashboard] Fallback: getSalesStats recibidos:', globalStats);
          dashStats = {
            totalSales: globalStats.totalSales,
            totalRevenue: globalStats.totalRevenue,
            totalCollected: 0,
            totalOutstanding: globalStats.totalOutstanding,
            totalProfit: 0,
            totalOverdueFees: 0,
          };
        } catch (fallbackErr) {
          console.error('❌ [Dashboard] Error en fallback (getSalesStats):', fallbackErr);
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

      console.log('✅ [Dashboard] Métricas finales combinadas:', merged);
      setMetrics(merged);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar métricas';
      console.error('❌ [Dashboard] Error final:', errorMsg, err);
      setError(errorMsg);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const availableYears = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y -= 1) {
      years.push(y);
    }
    return years;
  }, []);

  const months = useMemo(
    () => [
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
    ],
    []
  );

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
