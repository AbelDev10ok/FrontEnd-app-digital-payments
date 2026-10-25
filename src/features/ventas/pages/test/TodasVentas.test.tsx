import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import TodasVentas from '../TodasVentas';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleDocumentDto, SaleResponseDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn(),
    getSalesCounts: vi.fn(),
    getAllSalesPaginated: vi.fn(),
    emitirRemito: vi.fn(),
  },
}));

const pageMock = {
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
};

const venta: SaleResponseDto = {
  id: 10,
  client: { id: 5, name: 'Juana Pérez', telefono: '', email: '', direccion: '', seller: false },
  descriptionProduct: 'Televisor 32 pulgadas',
  priceTotal: 100000,
  dateSale: '2026-06-01',
  finalPaymentDate: '2026-12-01',
  realFinalPayment: '',
  typePayments: 'CONTADO',
  quantityFees: 0,
  amountFee: 0,
  fees: [],
  cost: 80000,
  interestRate: null,
  productType: null,
  paidFeesCount: 0,
  remainingAmount: 0,
  totalFees: 0,
  status: 'ACTIVE',
  kind: 'VENTA',
};

const documento: SaleDocumentDto = {
  id: 33,
  type: 'REMITO',
  number: 1,
  numberLabel: '000001',
  issuedAt: '2026-06-02T10:30:00',
  saleId: 10,
  saleDate: '2026-06-01',
  businessName: 'Cobros del Sur',
  businessAddress: null,
  businessTaxId: null,
  businessPhone: null,
  clientName: 'Juana Pérez',
  clientDoc: null,
  clientAddress: null,
  clientPhone: null,
  productName: 'Televisor 32 pulgadas',
  variantLabel: null,
  sku: null,
  quantity: 1,
  unitPrice: 100000,
  subtotal: 100000,
  total: 100000,
  currency: 'ARS',
  notes: null,
};

const renderPage = (path = '/dashboard/ventas/todas') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TodasVentas
        user={{ email: 'test@test.com', role: 'ROLE_USER' }}
        onLogout={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('TodasVentas', () => {
  beforeEach(() => {
    sessionStorage.clear();
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
    vi.mocked(salesService.getAllSalesPaginated).mockReset();
    vi.mocked(salesService.getAllSalesPaginated).mockResolvedValue(pageMock);
    vi.mocked(salesService.emitirRemito).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('combina kind, status y productType desde la URL en la petición', async () => {
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE&productType=2');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: 'PRESTAMO',
        status: 'ACTIVE',
        productType: '2',
      }),
    );
  });

  it('oculta la búsqueda por descripción y no la envía para préstamos', async () => {
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO');

    expect(
      screen.queryByPlaceholderText(/descripcion producto/i),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'PRESTAMO' }),
      ),
    );
    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.not.objectContaining({
        descriptionProduct: expect.anything(),
      }),
    );
  });

  it('traduce A_COBRAR a aCobrar=true en la petición', async () => {
    renderPage('/dashboard/ventas/todas?status=A_COBRAR');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.objectContaining({ aCobrar: true }),
    );
  });

  it('envía la búsqueda por descripción cuando se escribe', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByPlaceholderText(/descripcion producto/i),
      'TV',
    );

    await waitFor(
      () =>
        expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
          expect.objectContaining({ descriptionProduct: 'TV' }),
        ),
      { timeout: 2000 },
    );
  });

  it('Limpiar filtros quita el status de la petición y limpia la URL', async () => {
    const user = userEvent.setup();
    renderPage('/dashboard/ventas/todas?status=ACTIVE');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ status: 'ACTIVE' }),
      ),
    );
  });

  it('Limpiar filtros en préstamos conserva kind=PRESTAMO', async () => {
    const user = userEvent.setup();
    renderPage('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE');

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenCalled(),
    );

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    await waitFor(() =>
      expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'PRESTAMO' }),
      ),
    );
    expect(salesService.getAllSalesPaginated).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ status: 'ACTIVE' }),
    );
  });

  it('muestra el contador de resultados', async () => {
    vi.mocked(salesService.getAllSalesPaginated).mockResolvedValue({
      ...pageMock,
      totalElements: 7,
    });

    renderPage();

    expect(await screen.findByText('7 resultados')).toBeInTheDocument();
  });

  it('emite el remito desde la fila y abre la vista imprimible', async () => {
    const ventana = {
      location: { href: '' },
      close: vi.fn(),
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(ventana);
    let conRemito = false;
    vi.mocked(salesService.getAllSalesPaginated).mockImplementation(async () => ({
      ...pageMock,
      content: [
        conRemito
          ? {
              ...venta,
              remito: {
                id: 33,
                number: 1,
                numberLabel: '000001',
                issuedAt: '2026-06-02T10:30:00',
              },
            }
          : venta,
      ],
      totalElements: 1,
      numberOfElements: 1,
      empty: false,
    }));
    vi.mocked(salesService.emitirRemito).mockImplementation(async () => {
      conRemito = true;
      return documento;
    });

    renderPage();
    await screen.findByText('Televisor 32 pulgadas');

    fireEvent.click(screen.getByRole('button', { name: 'Emitir remito' }));

    const dialogo = await screen.findByRole('dialog');
    fireEvent.click(within(dialogo).getByRole('button', { name: /Emitir remito/ }));

    await waitFor(() => expect(salesService.emitirRemito).toHaveBeenCalledWith(10, undefined));
    await waitFor(() =>
      expect(ventana.location.href).toBe('/dashboard/ventas/10/remito'),
    );
    expect(
      await screen.findByRole('button', { name: 'Ver remito N° 000001' }),
    ).toBeInTheDocument();
  });
});
