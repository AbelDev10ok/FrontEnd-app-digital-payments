import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TODAS, useDashboardMetrics } from '../useDashboardMetrics';
import { salesService } from '@/features/ventas/services/salesServices';
import type { DashboardStatsDto } from '@/shared/types/dashboard';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { getDashboardStats: vi.fn() },
}));

// El hook sincroniza los filtros con la URL, así que necesita router
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(MemoryRouter, null, children);

// Wrapper con una URL inicial, para probar los filtros que vienen en el link
const wrapperConUrl = (entrada: string) =>
  ({ children }: { children: ReactNode }) =>
    createElement(MemoryRouter, { initialEntries: [entrada] }, children);

const dashStats: DashboardStatsDto = {
  year: 2026,
  month: 8,
  monedasDisponibles: ['ARS', 'USD'],
  resumen: {
    totalVentas: 10,
    totalVendido: { ARS: 1000 },
    totalCobrado: { ARS: 800 },
    pendienteDelMes: { ARS: 200 },
    deudaTotal: { ARS: 9000 },
    ganancia: { ARS: 150 },
    reembolsos: { ARS: 2 },
    completadas: 6,
    pendientes: 3,
    canceladas: 1,
    cuotasVencidas: { cantidad: 4, monto: { ARS: 400 } },
  },
  anual: { totalVentas: 50, totalVendido: { ARS: 5000 }, totalCobrado: { ARS: 4000 }, ganancia: { ARS: 800 } },
  serie12Meses: [{ year: 2026, month: 1, vendido: { ARS: 100 }, cobrado: { ARS: 80 }, ganancia: { ARS: 20 } }],
  topClientes: [{ clientId: 1, clientName: 'Ana', totalVentas: 2, totalVendido: { ARS: 500 }, totalCobrado: { ARS: 300 } }],
  porTipoProducto: [{ tipo: 'Crédito', totalVentas: 1, totalVendido: { ARS: 300 } }],
  clientes: { totalClientes: 20, activos: 12 },
};

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.mocked(salesService.getDashboardStats).mockReset();
    // El filtro de moneda se recuerda en localStorage entre visitas
    localStorage.clear();
  });

  it('mapea el DTO incluyendo cuotas vencidas, estados y resumen anual', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    await waitFor(() => expect(result.current.metrics).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.metrics?.totalSales).toBe(10);
    // El pendiente de la tarjeta es la deuda real a hoy, no la del mes consultado
    expect(result.current.metrics?.totalOutstanding).toEqual({ ARS: 9000 });
    expect(result.current.metrics?.totalOverdueFees).toBe(4);
    expect(result.current.metrics?.overdueAmount).toEqual({ ARS: 400 });
    expect(result.current.metrics?.statusSummary).toEqual({
      completadas: 6,
      pendientes: 3,
      canceladas: 1,
    });
    expect(result.current.metrics?.anual).toEqual(dashStats.anual);
    expect(result.current.metrics?.totalActiveClients).toBe(12);
  });

  it('setea error si la petición falla', async () => {
    vi.mocked(salesService.getDashboardStats).mockRejectedValue(new Error('Error de conexión'));

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('Error de conexión'));
    expect(result.current.metrics).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('setYear cambia el año y vuelve a llamar al servicio', async () => {
    const currentYear = new Date().getFullYear();
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    act(() => result.current.setYear(2025));
    await waitFor(() =>
      expect(salesService.getDashboardStats).toHaveBeenCalledWith(2025, result.current.month, TODAS),
    );
    expect(result.current.year).toBe(2025);
    expect(currentYear).not.toBe(2025);
  });

  it('setMonth cambia el mes y vuelve a llamar al servicio', async () => {
    const currentMonth = new Date().getMonth() + 1;
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    act(() => result.current.setMonth(3));
    await waitFor(() =>
      expect(salesService.getDashboardStats).toHaveBeenCalledWith(result.current.year, 3, TODAS),
    );
    expect(result.current.month).toBe(3);
    expect(currentMonth).not.toBe(3);
  });

  it('refresh vuelve a llamar al servicio con los mismos parámetros', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(salesService.getDashboardStats).toHaveBeenCalledTimes(1));
    const { year, month } = result.current;

    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(salesService.getDashboardStats).toHaveBeenCalledTimes(2));
    expect(salesService.getDashboardStats).toHaveBeenLastCalledWith(year, month, TODAS);
  });

  it('setCurrency filtra por moneda y la recuerda para la próxima visita', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    act(() => result.current.setCurrency('USD'));
    await waitFor(() =>
      expect(salesService.getDashboardStats).toHaveBeenLastCalledWith(
        result.current.year,
        result.current.month,
        'USD',
      ),
    );
    expect(result.current.currency).toBe('USD');
    expect(localStorage.getItem('dashboard-moneda')).toBe('USD');
  });

  it('arranca mostrando todas las monedas cuando no hay filtro guardado', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    expect(result.current.currency).toBe(TODAS);
    expect(salesService.getDashboardStats).toHaveBeenCalledWith(
      result.current.year,
      result.current.month,
      TODAS,
    );
  });

  it('retoma el último filtro de moneda elegido', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    localStorage.setItem('dashboard-moneda', 'USD');

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    expect(result.current.currency).toBe('USD');
    expect(salesService.getDashboardStats).toHaveBeenCalledWith(
      result.current.year,
      result.current.month,
      'USD',
    );
  });

  it('el parámetro moneda de la URL manda sobre el filtro guardado', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValue(dashStats);
    localStorage.setItem('dashboard-moneda', 'ARS');

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: wrapperConUrl('/?moneda=USD'),
    });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    expect(result.current.currency).toBe('USD');
    expect(salesService.getDashboardStats).toHaveBeenCalledWith(
      result.current.year,
      result.current.month,
      'USD',
    );
  });

  it('un error no borra los últimos datos válidos', async () => {
    vi.mocked(salesService.getDashboardStats).mockResolvedValueOnce(dashStats);
    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });
    await waitFor(() => expect(result.current.metrics).not.toBeNull());

    vi.mocked(salesService.getDashboardStats).mockRejectedValueOnce(new Error('Error de conexión'));
    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(result.current.error).toBe('Error de conexión'));
    expect(result.current.metrics).not.toBeNull();
  });
});
