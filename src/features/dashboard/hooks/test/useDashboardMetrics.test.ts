import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboardMetrics } from '../useDashboardMetrics';
import { salesService } from '@/features/ventas/services/salesServices';
import type { DashboardStatsDto } from '@/shared/types/dashboard';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { getDashboardStats: vi.fn() },
}));

const dashStats: DashboardStatsDto = {
  year: 2026,
  month: 8,
  resumen: {
    totalVentas: 10,
    totalVendido: 1000,
    totalCobrado: 800,
    pendientePorCobrar: 200,
    ganancia: 150,
    reembolsos: 2,
    completadas: 6,
    pendientes: 3,
    canceladas: 1,
    cuotasVencidas: { cantidad: 4, monto: 400 },
  },
  anual: { totalVentas: 50, totalVendido: 5000, totalCobrado: 4000, ganancia: 800 },
  serie12Meses: [{ year: 2026, month: 1, vendido: 100, cobrado: 80, ganancia: 20 }],
  topClientes: [{ clientId: 1, clientName: 'Ana', totalVentas: 2, totalVendido: 500, totalCobrado: 300 }],
  porTipoProducto: [{ tipo: 'Crédito', totalVentas: 1, totalVendido: 300 }],
  clientes: { totalClientes: 20, activos: 12 },
};

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.mocked(salesService.getDashboardStats).mockReset();
  });

  it('mapea el DTO incluyendo cuotas vencidas, estados y resumen anual', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => expect(result.current.metrics).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.metrics?.totalSales).toBe(10);
    expect(result.current.metrics?.totalOverdueFees).toBe(4);
    expect(result.current.metrics?.overdueAmount).toBe(400);
    expect(result.current.metrics?.statusSummary).toEqual({
      completadas: 6,
      pendientes: 3,
    });
    expect(result.current.metrics?.anual).toEqual(dashStats.anual);
    expect(result.current.metrics?.totalActiveClients).toBe(12);
  });

  it('setea error si la petición falla', async () => {
    vi.mocked(salesService.getDashboardStats).mockRejectedValue(new Error('Error de conexión'));

    const { result } = renderHook(() => useDashboardMetrics());

    await waitFor(() => expect(result.current.error).toBe('Error de conexión'));
    expect(result.current.metrics).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('setYear cambia el año y vuelve a llamar al servicio', async () => {
    const currentYear = new Date().getFullYear();
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    act(() => result.current.setYear(2025));
    await waitFor(() =>
      expect(salesService.getDashboardStats).toHaveBeenCalledWith(2025, result.current.month),
    );
    expect(result.current.year).toBe(2025);
    expect(currentYear).not.toBe(2025);
  });

  it('setMonth cambia el mes y vuelve a llamar al servicio', async () => {
    const currentMonth = new Date().getMonth() + 1;
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    act(() => result.current.setMonth(3));
    await waitFor(() =>
      expect(salesService.getDashboardStats).toHaveBeenCalledWith(result.current.year, 3),
    );
    expect(result.current.month).toBe(3);
    expect(currentMonth).not.toBe(3);
  });

  it('refresh vuelve a llamar al servicio con los mismos parámetros', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics());
    await waitFor(() => expect(salesService.getDashboardStats).toHaveBeenCalledTimes(1));
    const { year, month } = result.current;

    act(() => result.current.refresh());
    await waitFor(() => expect(salesService.getDashboardStats).toHaveBeenCalledTimes(2));
    expect(salesService.getDashboardStats).toHaveBeenLastCalledWith(year, month);
  });
});
