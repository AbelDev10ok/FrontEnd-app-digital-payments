import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { salesService } from '@/features/ventas/services/salesServices';
import type {
  DashboardAnual,
  MonthlySales,
  ProductTypeSales,
  TopClient,
} from '@/shared/types/dashboard';
import type { MontosPorMoneda } from '@/shared/types/money';

export interface SalesStatusSummary {
  completadas: number;
  pendientes: number;
  canceladas: number;
}

export interface DashboardMetrics {
  totalSales: number;
  /** Montos por moneda: las monedas distintas nunca se suman entre sí */
  totalRevenue: MontosPorMoneda;
  totalCollected: MontosPorMoneda;
  totalOutstanding: MontosPorMoneda;
  totalProfit: MontosPorMoneda;
  refunds: MontosPorMoneda;
  totalActiveClients: number;
  totalClients: number;
  totalOverdueFees: number;
  overdueAmount: MontosPorMoneda;
  statusSummary: SalesStatusSummary;
  anual: DashboardAnual;
  monthlySeries: MonthlySales[];
  topClients: TopClient[];
  productTypeBreakdown: ProductTypeSales[];
  monedasDisponibles: string[];
}

/** Valor del selector de moneda que incluye todas las monedas */
export const TODAS = 'TODAS';

/** Último filtro de moneda elegido en el tablero (se recuerda entre visitas). */
const MONEDA_FILTRO_KEY = 'dashboard-moneda';

const leerMonedaRecordada = (): string | null => {
  try {
    const guardada = localStorage.getItem(MONEDA_FILTRO_KEY);
    return guardada && guardada.trim() ? guardada.trim().toUpperCase() : null;
  } catch {
    // Sin storage (modo privado o bloqueado): se usa el default
    return null;
  }
};

const recordarMoneda = (moneda: string): void => {
  try {
    localStorage.setItem(MONEDA_FILTRO_KEY, moneda);
  } catch {
    // Sin storage: el filtro vive sólo en la URL de esta visita
  }
};

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

const parseYear = (value: string | null): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : null;
};

const parseMonth = (value: string | null): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
};

export const useDashboardMetrics = () => {
  // Los filtros viven en la URL (igual que la lista de ventas): recargar o
  // compartir el link conserva el período y la moneda seleccionados.
  const [searchParams, setSearchParams] = useSearchParams();
  const [year, setYearState] = useState<number>(
    () => parseYear(searchParams.get('anio')) ?? getCurrentYear(),
  );
  const [month, setMonthState] = useState<number>(
    () => parseMonth(searchParams.get('mes')) ?? getCurrentMonth(),
  );
  const [currency, setCurrencyState] = useState<string>(() => {
    // El link manda (permite compartir un filtro puntual); si no, se retoma el
    // último filtro elegido y, en la primera visita, se muestran todas las
    // monedas — el tablero no depende de la moneda predeterminada de Mi Negocio.
    const param = searchParams.get('moneda');
    if (param && param.trim()) return param.trim().toUpperCase();
    return leerMonedaRecordada() ?? TODAS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const requestIdRef = useRef(0);

  const updateParams = useCallback(
    (patch: Record<string, string>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => next.set(key, value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setYear = useCallback(
    (value: number) => {
      setYearState(value);
      updateParams({ anio: String(value) });
    },
    [updateParams],
  );

  const setMonth = useCallback(
    (value: number) => {
      setMonthState(value);
      updateParams({ mes: String(value) });
    },
    [updateParams],
  );

  const setCurrency = useCallback(
    (value: string) => {
      setCurrencyState(value);
      recordarMoneda(value);
      updateParams({ moneda: value });
    },
    [updateParams],
  );

  const fetchMetrics = useCallback(async () => {
    // Guard de carrera: si cambian los filtros rápido, solo la última
    // respuesta pinta la pantalla (las respuestas viejas se descartan).
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const dashStats = await salesService.getDashboardStats(year, month, currency);
      if (requestId !== requestIdRef.current) return;

      const merged: DashboardMetrics = {
        totalSales: dashStats.resumen.totalVentas,
        totalRevenue: dashStats.resumen.totalVendido,
        totalCollected: dashStats.resumen.totalCobrado,
        // Deuda real a hoy (no la del mes consultado): es la que el usuario lee
        // como "lo que me deben"
        totalOutstanding: dashStats.resumen.deudaTotal,
        totalProfit: dashStats.resumen.ganancia,
        refunds: dashStats.resumen.reembolsos ?? {},
        totalOverdueFees: dashStats.resumen.cuotasVencidas.cantidad,
        overdueAmount: dashStats.resumen.cuotasVencidas.monto,
        statusSummary: {
          completadas: dashStats.resumen.completadas,
          pendientes: dashStats.resumen.pendientes,
          canceladas: dashStats.resumen.canceladas,
        },
        anual: dashStats.anual,
        totalActiveClients: dashStats.clientes.activos,
        totalClients: dashStats.clientes.totalClientes,
        monthlySeries: dashStats.serie12Meses,
        topClients: dashStats.topClientes,
        productTypeBreakdown: dashStats.porTipoProducto,
        monedasDisponibles: dashStats.monedasDisponibles ?? [],
      };

      setMetrics(merged);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      // Un error temporal no borra los últimos datos válidos
      setError(err instanceof Error ? err.message : 'Error al cargar métricas');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [year, month, currency]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
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
    refresh: fetchMetrics,
  };
};
