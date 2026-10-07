import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuthStore } from '@/features/auth/store/authStore';

// Mock de servicios para evitar llamadas reales (que dispararían logout por token inválido
// en los tests y volverían las rutas lazy no deterministas).
vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getSellers: vi.fn().mockResolvedValue([]),
    getClientsBySeller: vi.fn().mockResolvedValue([]),
    getProductTypes: vi.fn().mockResolvedValue([]),
    getAllSalesPaginated: vi.fn().mockResolvedValue({
      content: [],
      pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false, sort: { sorted: false, unsorted: true, empty: true } },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: 10,
      number: 0,
      sort: { sorted: false, unsorted: true, empty: true },
      numberOfElements: 0,
      first: true,
      empty: true,
    }),
    getAllSales: vi.fn().mockResolvedValue([]),
    getAllLoans: vi.fn().mockResolvedValue([]),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    }),
    getSaleById: vi.fn(),
    createSale: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
    markFeeAsPaid: vi.fn(),
    postponeFee: vi.fn(),
    deleteFee: vi.fn(),
    getDashboardStats: vi.fn().mockResolvedValue({
      year: 2026,
      month: 1,
      resumen: {
        totalVentas: 0,
        totalVendido: 0,
        totalCobrado: 0,
        pendientePorCobrar: 0,
        ganancia: 0,
        reembolsos: 0,
        completadas: 0,
        pendientes: 0,
        canceladas: 0,
        cuotasVencidas: { cantidad: 0, monto: 0 },
      },
      anual: { totalVentas: 0, totalVendido: 0, totalCobrado: 0, ganancia: 0 },
      serie12Meses: [],
      topClientes: [],
      porTipoProducto: [],
      clientes: { totalClientes: 0, activos: 0 },
    }),
  },
}));

vi.mock('@/features/clients/services/clientServices', () => ({
  clientService: {
    getClientsPaginated: vi.fn().mockResolvedValue({
      content: [],
      pageable: { pageNumber: 0, pageSize: 1000, offset: 0, paged: true, unpaged: false, sort: { sorted: false, unsorted: true, empty: true } },
      totalPages: 0,
      totalElements: 0,
      last: true,
      size: 1000,
      number: 0,
      sort: { sorted: false, unsorted: true, empty: true },
      numberOfElements: 0,
      first: true,
      empty: true,
    }),
    getClientById: vi.fn(),
    calcularDeudaTotalVentas: vi.fn(),
    calcularTotalVentasPagadas: vi.fn(),
    calcularDeudaTotalPrestamos: vi.fn(),
    calcularTotalPrestamosPagados: vi.fn(),
    habilitarVendedor: vi.fn(),
    desabilitarVendedor: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
    deleteClient: vi.fn(),
    getVendedoresConClientesAsignados: vi.fn().mockResolvedValue([]),
    getVendedoresActivos: vi.fn().mockResolvedValue([]),
  },
}));

// El shell (DashboardLayout) carga la moneda del negocio (initCurrency) al montar;
// sin este mock, con el backend levantado el token falso dispara logout y rompe las rutas.
vi.mock('@/features/negocio/services/businessService', () => ({
  businessService: {
    getMyBusiness: vi.fn().mockResolvedValue({
      id: 1,
      name: 'Negocio de test',
      currency: 'ARS',
      defaultInterestRate: null,
      defaultPaymentFrequency: null,
      planStatus: 'TRIAL',
      trialEndsAt: null,
      subscriptionUntil: null,
      createdAt: '2026-01-01',
    }),
    updateMyBusiness: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const encodePayload = (obj: object) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Token largo (no expira pronto) para que TokenRefreshHandler no refresque durante el test.
const longToken = `${encodePayload({ alg: 'HS256' })}.${encodePayload({
  sub: 'user@x.com',
  authorities: '[ROLE_USER]',
  exp: Math.floor(Date.now() / 1000) + 7200,
})}.firma`;

const setAuthedUser = () => {
  useAuthStore.setState({
    user: { email: 'user@x.com', role: 'ROLE_USER' },
    accessToken: longToken,
    refreshToken: 'rt',
    isAuthenticated: true,
    isLoading: false,
  });
};

describe('rutas de App', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.history.pushState({}, '', '/');
  });

  it('/dashboard/ventas/crear no es capturada por la ruta dinámica :id', async () => {
    setAuthedUser();
    window.history.pushState({}, '', '/dashboard/ventas/crear');
    render(<App />);
    const titulos = await screen.findAllByText('Nueva Venta', undefined, { timeout: 5000 });
    expect(titulos.length).toBeGreaterThan(0);
  });

  it('/dashboard/ventas/todas no es capturada por la ruta dinámica :id', async () => {
    setAuthedUser();
    window.history.pushState({}, '', '/dashboard/ventas/todas');
    render(<App />);
    const titulos = await screen.findAllByText('Todas las Ventas', undefined, { timeout: 10000 });
    expect(titulos.length).toBeGreaterThan(0);
  });

  it('muestra la landing en / sin sesión', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(
      await screen.findByRole('heading', { level: 1, name: /cuotas/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('/login muestra el formulario de inicio de sesión', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(await screen.findByText('Iniciar Sesión', undefined, { timeout: 5000 })).toBeInTheDocument();
  });

  it('/register muestra el formulario de creación de cuenta', async () => {
    window.history.pushState({}, '', '/register');
    render(<App />);
    expect(
      await screen.findByRole('heading', { name: /creá tu cuenta/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});
