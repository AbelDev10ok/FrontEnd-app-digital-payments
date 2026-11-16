import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Inventario from '../pages/Inventario';
import { salesService } from '@/features/ventas/services/salesServices';
import type { Page } from '@/features/ventas/services/salesServices';
import type { ProductDto, StockMovementDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProducts: vi.fn(),
    getStockMovements: vi.fn(),
    registrarIngresoStock: vi.fn(),
    getProductTypes: vi.fn(),
    getSalesCounts: vi.fn(),
  },
}));

// El shell (DashboardLayout) carga la moneda del negocio (initCurrency) al montar.
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

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Inventario user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

/** Fila del catálogo: un SKU con su stock actual. */
const sku = (overrides: Partial<ProductDto> = {}): ProductDto => ({
  id: 1,
  variantId: 11,
  name: 'Heladera Samsung',
  sku: 'HEL-1',
  stock: 12,
  cost: 400,
  price: 500,
  currency: 'ARS',
  attributes: [],
  ...overrides,
});

const movimiento = (overrides: Partial<StockMovementDto> = {}): StockMovementDto => ({
  id: 1,
  variantId: 11,
  sku: 'HEL-1',
  type: 'INGRESO',
  delta: 30,
  reason: 'Carga inicial',
  createdAt: '2026-11-16T12:00:00',
  createdBy: 'duenio@test.com',
  ...overrides,
});

const pagina = <T,>(content: T[]): Page<T> => ({
  content,
  pageable: {
    sort: { sorted: false, unsorted: true, empty: true },
    offset: 0,
    pageNumber: 0,
    pageSize: 10,
    paged: true,
    unpaged: false,
  },
  totalPages: 1,
  totalElements: content.length,
  last: true,
  size: 10,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  numberOfElements: content.length,
  first: true,
  empty: content.length === 0,
});

describe('Inventario', () => {
  beforeEach(() => {
    vi.mocked(salesService.getProductTypes).mockReset();
    vi.mocked(salesService.getProductTypes).mockResolvedValue([]);
    vi.mocked(salesService.getSalesCounts).mockReset();
    vi.mocked(salesService.getSalesCounts).mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    });
    vi.mocked(salesService.getProducts).mockReset();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      sku(),
      sku({ variantId: 12, sku: 'HEL-2', variantLabel: 'Inox', stock: 3 }),
    ]);
    vi.mocked(salesService.getStockMovements).mockReset();
    vi.mocked(salesService.getStockMovements).mockResolvedValue(pagina([]));
    vi.mocked(salesService.registrarIngresoStock).mockReset();
    vi.mocked(salesService.registrarIngresoStock).mockResolvedValue([movimiento()]);
  });

  it('lista una fila por SKU con su stock actual', async () => {
    renderPagina();

    const fila = await screen.findByRole('row', { name: /HEL-1/ });
    expect(within(fila).getByText('Heladera Samsung')).toBeInTheDocument();
    expect(within(fila).getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /HEL-2/ })).toBeInTheDocument();
    expect(screen.getByText(/2 SKU/)).toBeInTheDocument();
  });

  it('filtra los SKUs desde el buscador', async () => {
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText('HEL-1');
    await user.type(screen.getByLabelText('Buscar en el inventario'), 'HEL-2');

    expect(screen.queryByText('HEL-1')).not.toBeInTheDocument();
    expect(screen.getByText('HEL-2')).toBeInTheDocument();
  });

  it('busca por atributo ignorando los separadores', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getProducts).mockResolvedValue([
      sku({
        attributes: [
          { attributeId: 1, attributeName: 'Ram', attributeValueId: 5, value: '4' },
        ],
      }),
    ]);
    renderPagina();

    await screen.findByText('HEL-1');
    // El atributo se muestra "Ram: 4", pero el usuario escribe "ram 4".
    await user.type(screen.getByLabelText('Buscar en el inventario'), 'ram 4');

    expect(screen.getByText('HEL-1')).toBeInTheDocument();
  });

  it('registra un ingreso de mercadería por lote', async () => {
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText('HEL-1');
    await user.click(screen.getByRole('button', { name: /Ingreso de mercadería/ }));

    const dialogo = await screen.findByRole('dialog');
    await user.selectOptions(within(dialogo).getByLabelText(/Variante/), '12');
    await user.type(within(dialogo).getByLabelText(/Cantidad/), '5');
    await user.type(within(dialogo).getByLabelText(/Costo unitario/), '150.50');
    await user.click(within(dialogo).getByRole('button', { name: 'Registrar ingreso' }));

    await waitFor(() =>
      expect(salesService.registrarIngresoStock).toHaveBeenCalledWith({
        note: null,
        lines: [{ variantId: 12, quantity: 5, unitCost: 150.5 }],
      }),
    );
    expect(await screen.findByText('Ingreso registrado')).toBeInTheDocument();
    // El ingreso refresca el catálogo para mostrar el stock nuevo.
    await waitFor(() => expect(salesService.getProducts).toHaveBeenCalledTimes(2));
  });

  it('muestra el historial de movimientos del SKU con su stock actual', async () => {
    const user = userEvent.setup();
    vi.mocked(salesService.getStockMovements).mockResolvedValue(
      pagina([
        movimiento(),
        movimiento({
          id: 2,
          type: 'VENTA',
          delta: -2,
          reason: null,
          saleId: 9,
          unitCost: null,
          createdBy: 'vendedor@test.com',
        }),
      ]),
    );
    renderPagina();

    await screen.findByText('HEL-1');
    await user.click(screen.getByRole('button', { name: 'Movimientos de HEL-1' }));

    await waitFor(() =>
      expect(salesService.getStockMovements).toHaveBeenCalledWith({
        variantId: 11,
        page: 0,
        size: 10,
      }),
    );
    expect(await screen.findByText('Carga inicial')).toBeInTheDocument();
    expect(screen.getByText('+30')).toBeInTheDocument();
    expect(screen.getByText('Venta N° 9')).toBeInTheDocument();
    expect(screen.getByText('duenio@test.com')).toBeInTheDocument();
    expect(screen.getByText(/Stock actual:/)).toBeInTheDocument();
  });

  it('valida el ingreso antes de llamar al backend', async () => {
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText('HEL-1');
    await user.click(screen.getByRole('button', { name: /Ingreso de mercadería/ }));

    const dialogo = await screen.findByRole('dialog');
    await user.click(within(dialogo).getByRole('button', { name: 'Registrar ingreso' }));

    expect(
      await within(dialogo).findByText('Elegí la variante de la línea 1'),
    ).toBeInTheDocument();
    expect(salesService.registrarIngresoStock).not.toHaveBeenCalled();
  });
});
