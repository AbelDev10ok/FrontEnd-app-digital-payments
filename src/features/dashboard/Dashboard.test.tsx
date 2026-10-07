import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import type { DashboardMetrics } from './hooks/useDashboardMetrics';

vi.mock('./hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: vi.fn(),
}));

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn().mockResolvedValue([]),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    }),
  },
}));

const metrics: DashboardMetrics = {
  totalSales: 5,
  totalRevenue: 1500,
  totalCollected: 1000,
  totalOutstanding: 500,
  totalProfit: 300,
  totalActiveClients: 4,
  totalOverdueFees: 2,
  overdueAmount: 250,
  statusSummary: { completadas: 3, pendientes: 1 },
  anual: { totalVentas: 20, totalVendido: 6000, totalCobrado: 4500, ganancia: 1200 },
  monthlySeries: [
    { year: 2026, month: 8, vendido: 100, cobrado: 80, ganancia: 20 },
    { year: 2026, month: 9, vendido: 200, cobrado: 150, ganancia: 40 },
  ],
  topClients: [
    { clientId: 1, clientName: 'Ana', totalVentas: 3, totalVendido: 900, totalCobrado: 700 },
  ],
  productTypeBreakdown: [{ tipo: 'Crédito', totalVentas: 2, totalVendido: 800 }],
};

const baseHookMock = {
  loading: false,
  error: null,
  year: 2026,
  month: 8,
  setYear: vi.fn(),
  setMonth: vi.fn(),
  availableYears: [2026, 2025],
  months: [
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
  ],
  refresh: vi.fn(),
};

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Dashboard user={{ email: 'a@b.com', role: 'ROLE_USER' }} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useDashboardMetrics).mockReturnValue({ ...baseHookMock, metrics } as ReturnType<typeof useDashboardMetrics>);
  });

  it('renderiza las seis tarjetas de métricas', () => {
    renderDashboard();
    ['Clientes activos', 'Total vendido', 'Ingresos cobrados', 'Pendiente por cobrar'].forEach(
      (label) => expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getAllByText('Ventas').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ganancia esperada').length).toBeGreaterThan(0);
  });

  it('muestra la alerta de cuotas vencidas con monto', () => {
    renderDashboard();
    expect(screen.getByText('2 cuotas vencidas')).toBeInTheDocument();
    expect(screen.getByText(/Monto total por cobrar/)).toBeInTheDocument();
  });

  it('no muestra la alerta cuando no hay cuotas vencidas', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: { ...metrics, totalOverdueFees: 0, overdueAmount: 0 },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.queryByText(/cuotas vencidas/)).not.toBeInTheDocument();
  });

  it('renderiza el desglose de estados de venta', () => {
    renderDashboard();
    ['Completadas', 'Pendientes'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });

  it('renderiza el resumen anual', () => {
    renderDashboard();
    expect(screen.getByText('Resumen anual 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Vendido').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cobrado').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ganancia/i).length).toBeGreaterThan(0);
  });

  it('renderiza el gráfico mensual y el top de clientes', () => {
    renderDashboard();
    expect(screen.getByText('Ventas últimos 12 meses')).toBeInTheDocument();
    expect(screen.getAllByText('Vendido').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cobrado').length).toBeGreaterThan(0);
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('muestra el estado de carga', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      loading: true,
      metrics: null,
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getByText('Cargando métricas...')).toBeInTheDocument();
  });

  it('muestra el error al fallar la carga', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      error: 'Error de conexión',
      metrics: null,
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getByText('Error al cargar métricas')).toBeInTheDocument();
    expect(screen.getByText('Error de conexión')).toBeInTheDocument();
  });

  it('cambiar el mes llama a setMonth', () => {
    renderDashboard();
    const [monthSelect] = screen.getAllByRole('combobox');
    fireEvent.change(monthSelect, { target: { value: '7' } });
    expect(baseHookMock.setMonth).toHaveBeenCalledWith(7);
    expect(baseHookMock.setYear).not.toHaveBeenCalled();
  });

  it('cambiar el año llama a setYear', () => {
    renderDashboard();
    const [, yearSelect] = screen.getAllByRole('combobox');
    fireEvent.change(yearSelect, { target: { value: '2025' } });
    expect(baseHookMock.setYear).toHaveBeenCalledWith(2025);
  });

  it('el botón Actualizar dispara refresh', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar métricas' }));
    expect(baseHookMock.refresh).toHaveBeenCalled();
  });
});
