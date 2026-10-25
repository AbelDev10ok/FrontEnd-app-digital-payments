import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import type { DashboardMetrics } from './hooks/useDashboardMetrics';

vi.mock('./hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: vi.fn(),
  TODAS: 'TODAS',
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

// getCurrency es lo único de formatCurrency que el dashboard usa para armar el
// filtro de moneda: se mockea para simular una moneda de negocio legada.
const { monedaNegocio } = vi.hoisted(() => ({ monedaNegocio: { valor: 'ARS' } }));

vi.mock('@/shared/utils/formatCurrency', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/utils/formatCurrency')>();
  return { ...actual, getCurrency: () => monedaNegocio.valor };
});

const metrics: DashboardMetrics = {
  totalSales: 5,
  totalRevenue: { ARS: 1500 },
  totalCollected: { ARS: 1000 },
  totalOutstanding: { ARS: 500 },
  totalProfit: { ARS: 300 },
  refunds: { ARS: 50 },
  totalActiveClients: 4,
  totalClients: 10,
  totalOverdueFees: 2,
  overdueAmount: { ARS: 250 },
  statusSummary: { completadas: 3, pendientes: 1, canceladas: 1 },
  anual: { totalVentas: 20, totalVendido: { ARS: 6000 }, totalCobrado: { ARS: 4500 }, ganancia: { ARS: 1200 } },
  monthlySeries: [
    { year: 2026, month: 7, vendido: { ARS: 50 }, cobrado: { ARS: 30 }, ganancia: { ARS: 10 } },
    { year: 2026, month: 8, vendido: { ARS: 100 }, cobrado: { ARS: 80 }, ganancia: { ARS: 20 } },
    { year: 2026, month: 9, vendido: { ARS: 200 }, cobrado: { ARS: 150 }, ganancia: { ARS: 40 } },
  ],
  topClients: [
    { clientId: 1, clientName: 'Ana', totalVentas: 3, totalVendido: { ARS: 900 }, totalCobrado: { ARS: 700 } },
  ],
  productTypeBreakdown: [{ tipo: 'Crédito', totalVentas: 2, totalVendido: { ARS: 800 } }],
  monedasDisponibles: ['ARS'],
};

const baseHookMock = {
  loading: false,
  error: null,
  year: 2026,
  month: 8,
  currency: 'TODAS',
  setYear: vi.fn(),
  setMonth: vi.fn(),
  setCurrency: vi.fn(),
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
    monedaNegocio.valor = 'ARS';
    vi.mocked(useDashboardMetrics).mockReturnValue({ ...baseHookMock, metrics } as ReturnType<typeof useDashboardMetrics>);
  });

  it('renderiza las seis tarjetas de métricas', () => {
    renderDashboard();
    ['Clientes activos', 'Total vendido', 'Ingresos cobrados', 'Pendiente por cobrar'].forEach(
      (label) => expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getAllByText('Operaciones').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ganancia estimada').length).toBeGreaterThan(0);
  });

  it('aclara el alcance de cada indicador', () => {
    renderDashboard();

    // La deuda es lo que se debe hoy, de todas las operaciones (no del mes)
    expect(screen.getByText('a hoy, todas las operaciones')).toBeInTheDocument();
    // La ganancia estimada sí es de las operaciones del mes consultado
    expect(screen.getByText('de las operaciones de agosto')).toBeInTheDocument();
  });

  it('muestra la alerta de cuotas vencidas con monto', () => {
    renderDashboard();
    expect(screen.getByText('2 cuotas vencidas')).toBeInTheDocument();
    expect(screen.getByText(/Monto total por cobrar/)).toBeInTheDocument();
  });

  it('no muestra la alerta cuando no hay cuotas vencidas', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: { ...metrics, totalOverdueFees: 0, overdueAmount: {} },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.queryByText(/cuotas vencidas/)).not.toBeInTheDocument();
  });

  it('renderiza el desglose de estados de venta', () => {
    renderDashboard();
    // Los labels también existen en los filtros del sidebar (visible para AT
    // solo cuando está expandido), así que se consulta con AllByText.
    ['Completadas', 'Pendientes', 'Canceladas'].forEach((label) =>
      expect(screen.getAllByText(label).length).toBeGreaterThan(0),
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
    expect(screen.getByText('Operaciones últimos 12 meses')).toBeInTheDocument();
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

  it('muestra el error al fallar la carga, con copy de negocio', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      error: 'Error de conexión',
      metrics: null,
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getByText('No pudimos cargar las métricas')).toBeInTheDocument();
    expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    // Sin instrucciones de desarrollador ni endpoints en la UI
    expect(screen.queryByText(/F12/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/api\//)).not.toBeInTheDocument();
  });

  it('cambiar el mes llama a setMonth', () => {
    renderDashboard();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por mes' }), {
      target: { value: '7' },
    });
    expect(baseHookMock.setMonth).toHaveBeenCalledWith(7);
    expect(baseHookMock.setYear).not.toHaveBeenCalled();
  });

  it('cambiar el año llama a setYear', () => {
    renderDashboard();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por año' }), {
      target: { value: '2025' },
    });
    expect(baseHookMock.setYear).toHaveBeenCalledWith(2025);
  });

  it('el selector de moneda incluye "Todas las monedas" y llama a setCurrency', () => {
    renderDashboard();
    const select = screen.getByRole('combobox', { name: 'Filtrar por moneda' });
    expect(screen.getByRole('option', { name: 'Todas las monedas' })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'ARS' } });
    expect(baseHookMock.setCurrency).toHaveBeenCalledWith('ARS');
  });

  it('el selector de moneda ofrece siempre ARS y USD, y descarta otras de los datos', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: { ...metrics, monedasDisponibles: ['ARS', 'PYG'] },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();

    const select = screen.getByRole('combobox', { name: 'Filtrar por moneda' });
    const opciones = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(opciones).toEqual(['TODAS', 'ARS', 'USD']);
  });

  it('mantiene la moneda legada del negocio si tiene datos, para no ocultar su historial', () => {
    monedaNegocio.valor = 'PYG';
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: { ...metrics, monedasDisponibles: ['ARS', 'PYG'] },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();

    const select = screen.getByRole('combobox', { name: 'Filtrar por moneda' });
    const opciones = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(opciones).toEqual(['TODAS', 'ARS', 'PYG', 'USD']);
  });

  it('muestra el CTA cuando no hay actividad', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: { ...metrics, totalSales: 0, totalClients: 0 },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getByText('Todavía no hay actividad')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear operación' })).toBeInTheDocument();
  });

  it('el botón Actualizar dispara refresh', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar métricas' }));
    expect(baseHookMock.refresh).toHaveBeenCalled();
  });

  it('explica la variación de ventas contra el mes anterior con los montos', () => {
    renderDashboard();
    expect(screen.getByText('Ventas vs mes anterior')).toBeInTheDocument();
    expect(screen.getByText('+100%')).toBeInTheDocument();
    expect(
      screen.getByText(/Pasaste de .*50 en Julio a .*100 en Agosto/),
    ).toBeInTheDocument();
  });

  it('explica el promedio por operación y no usa jerga (% de cobranza, ticket)', () => {
    renderDashboard();
    expect(screen.getByText('Promedio por operación')).toBeInTheDocument();
    // 4 operaciones sin cancelar (5 - 1) sobre $1.500 facturados
    expect(screen.getByText(/375/)).toBeInTheDocument();
    expect(
      screen.getByText(/4 operaciones en Agosto, .*1\.500 facturados/),
    ).toBeInTheDocument();
    expect(screen.queryByText('% de cobranza')).not.toBeInTheDocument();
    expect(screen.queryByText(/ticket/i)).not.toBeInTheDocument();
  });

  it('avisa cuando el mes anterior no tuvo ventas', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: {
        ...metrics,
        monthlySeries: [
          { year: 2026, month: 8, vendido: { ARS: 100 }, cobrado: { ARS: 80 }, ganancia: { ARS: 20 } },
        ],
      },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getByText('nuevo')).toBeInTheDocument();
    expect(screen.getByText('En Julio no hubo ventas.')).toBeInTheDocument();
  });

  it('avisa que no se puede promediar con monedas mezcladas', () => {
    vi.mocked(useDashboardMetrics).mockReturnValue({
      ...baseHookMock,
      metrics: {
        ...metrics,
        totalRevenue: { ARS: 100, USD: 10 },
        monedasDisponibles: ['ARS', 'USD'],
      },
    } as ReturnType<typeof useDashboardMetrics>);
    renderDashboard();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Con monedas mezcladas no se puede promediar; elegí una moneda arriba.'),
    ).toBeInTheDocument();
  });
});
