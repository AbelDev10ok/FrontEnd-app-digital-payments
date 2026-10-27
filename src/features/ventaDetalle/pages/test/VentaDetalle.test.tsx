import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VentaDetalle from '../VentaDetalle';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleDocumentDto, SaleResponseDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getSaleById: vi.fn(),
    cancelSale: vi.fn(),
    deleteSale: vi.fn(),
    emitirRemito: vi.fn(),
  },
}));

vi.mock('@/shared/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/StateDetalleTransaction', () => ({
  default: ({ showDetails }: { showDetails?: boolean }) => (
    <div data-testid="state-detalle" data-expanded={String(showDetails)} />
  ),
}));

vi.mock('../../components/CronogramaFees', () => ({
  default: () => <div data-testid="cronograma" />,
}));

vi.mock('../../components/ClientInfoDetalle', () => ({
  default: () => <div data-testid="cliente-detalle" />,
}));

vi.mock('../../components/InfoTransactionDetalle', () => ({
  default: () => <div data-testid="info-detalle" />,
}));

const crearTransaccion = (overrides: Partial<SaleResponseDto> = {}): SaleResponseDto => ({
  id: 10,
  client: { id: 5, name: 'Juana Pérez', telefono: '', email: '', direccion: '', seller: false },
  descriptionProduct: 'Televisor 32 pulgadas',
  priceTotal: 60000,
  dateSale: '2026-06-01',
  finalPaymentDate: '2026-12-01',
  realFinalPayment: '',
  typePayments: 'MENSUAL',
  quantityFees: 4,
  amountFee: 15000,
  fees: [],
  cost: 50000,
  interestRate: null,
  productType: null,
  paidFeesCount: 0,
  remainingAmount: 60000,
  totalFees: 4,
  status: 'ACTIVE',
  kind: 'VENTA',
  ...overrides,
});

const documento: SaleDocumentDto = {
  id: 33,
  type: 'REMITO',
  number: 1,
  numberLabel: '000001',
  issuedAt: '2026-06-02T10:30:00',
  saleId: 10,
  saleDate: '2026-06-01',
  businessName: 'Cobros del Sur',
  businessAddress: 'Av. Siempre Viva 123',
  businessTaxId: '20123456789',
  businessPhone: '1144556677',
  clientName: 'Juana Pérez',
  clientDoc: '30111222',
  clientAddress: 'Calle Falsa 742',
  clientPhone: '1144445555',
  productName: 'Televisor 32 pulgadas',
  variantLabel: 'Color: Negro',
  sku: 'TV-32-NEGRO',
  quantity: 2,
  unitPrice: 50000,
  subtotal: 100000,
  total: 100000,
  currency: 'ARS',
  notes: null,
};

let navigateState: { pathname: string; state: unknown } | null = null;

const RouteRecorder = () => {
  const location = useLocation();
  useEffect(() => {
    navigateState = { pathname: location.pathname, state: location.state };
  }, [location]);
  return null;
};

const renderPagina = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/ventas/10']}>
      <Routes>
        <Route
          path="/dashboard/ventas/:id"
          element={<VentaDetalle user={{ email: 'a@a.com' }} onLogout={vi.fn()} />}
        />
        <Route path="/dashboard/ventas/crear" element={<RouteRecorder />} />
        <Route path="/dashboard/prestamos/crear" element={<RouteRecorder />} />
        <Route path="/dashboard/ventas/todas" element={<RouteRecorder />} />
      </Routes>
    </MemoryRouter>,
  );

const abrirMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Opciones de la transacción' }));
};

describe('VentaDetalle', () => {
  beforeEach(() => {
    navigateState = null;
    vi.mocked(salesService.getSaleById).mockReset();
    vi.mocked(salesService.cancelSale).mockReset();
    vi.mocked(salesService.deleteSale).mockReset();
    vi.mocked(salesService.emitirRemito).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('anula la venta sin restock ni devolución por defecto', async () => {
    const cancelada = crearTransaccion({ status: 'CANCELED' });
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion());
    vi.mocked(salesService.cancelSale).mockResolvedValue(cancelada);

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));

    // Los dos efectos arrancan sin marcar: no se repone stock ni se registra
    // una devolución sin una decisión explícita.
    expect(screen.getByText('No hay cobros registrados que devolver.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    await waitFor(() => expect(salesService.cancelSale).toHaveBeenCalledWith(10, false, false, ''));
    await waitFor(() => expect(screen.queryByText('Anular venta')).not.toBeInTheDocument());
  });

  it('permite marcar la devolución del monto cobrado y la envía al anular', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({ collectedAmount: 100, refundAmount: 0 }),
    );
    vi.mocked(salesService.cancelSale).mockResolvedValue(
      crearTransaccion({ status: 'CANCELED', collectedAmount: 100, refundAmount: 100 }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));

    const devolucion = screen.getByRole('checkbox', { name: /Registrar devolución/ });
    expect(devolucion).not.toBeChecked();
    fireEvent.click(devolucion);

    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    await waitFor(() => expect(salesService.cancelSale).toHaveBeenCalledWith(10, true, false, ''));
  });

  it('permite marcar reponer el stock al anular una venta con producto', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({
        quantity: 2,
        product: { id: 3, name: 'Televisor 32', variantId: 9 },
      }),
    );
    vi.mocked(salesService.cancelSale).mockResolvedValue(
      crearTransaccion({ status: 'CANCELED' }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));

    const reponer = screen.getByRole('checkbox', { name: /Reponer 2 unidades al stock/ });
    expect(reponer).not.toBeChecked();
    fireEvent.click(reponer);

    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    await waitFor(() => expect(salesService.cancelSale).toHaveBeenCalledWith(10, false, true, ''));
  });

  it('no ofrece devolución cuando no hay monto cobrado y lo aclara', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion({ collectedAmount: 0 }));

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));

    expect(screen.queryByRole('checkbox', { name: /devolución/ })).not.toBeInTheDocument();
    expect(screen.getByText('No hay cobros registrados que devolver.')).toBeInTheDocument();
  });

  it('no muestra la opción Eliminar cuando la venta ya tiene cobros', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({ paidFeesCount: 1, collectedAmount: 15000 }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();

    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    expect(screen.getByText('Anular venta')).toBeInTheDocument();
  });

  it('oculta Anular venta y Editar si la transacción ya está CANCELADA', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion({ status: 'CANCELED' }));

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();

    expect(screen.queryByText('Anular venta')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar')).not.toBeInTheDocument();
  });

  it('Recrear venta no aparece en el menú', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({ id: 10, kind: 'VENTA', product: { id: 3, name: 'Televisor 32' } }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();

    expect(screen.queryByText('Recrear venta')).not.toBeInTheDocument();
  });

  it('pliega los datos del cliente y la economía hasta tocar Ver detalles', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion());

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    expect(screen.getByTestId('state-detalle')).toHaveAttribute('data-expanded', 'false');
    expect(screen.getByTestId('cliente-detalle').closest('.hidden')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalles' }));

    expect(screen.getByTestId('state-detalle')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByTestId('cliente-detalle').closest('.hidden')).toBeNull();
    expect(screen.getByTestId('info-detalle').closest('.hidden')).toBeNull();
    expect(screen.getByRole('button', { name: 'Ocultar detalles' })).toBeInTheDocument();
  });

  it('elimina la venta y navega al listado cuando no tiene pagos', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion());
    vi.mocked(salesService.deleteSale).mockResolvedValue();

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Eliminar'));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(salesService.deleteSale).toHaveBeenCalledWith(10));
    await waitFor(() => expect(navigateState?.pathname).toBe('/dashboard/ventas/todas'));
  });

  it('no ofrece Eliminar cuando la venta tiene remito emitido', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();

    // El remito emitido conserva la venta: se anula, no se borra
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    expect(screen.getByText('Anular venta')).toBeInTheDocument();
  });

  it('avisa que anular la venta conserva el remito emitido', async () => {
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));

    expect(
      screen.getByText('El remito N° 000001 ya emitido se conserva.'),
    ).toBeInTheDocument();
  });

  it('abre el remito ya emitido en una pestaña nueva sin volver a emitirlo', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.mocked(salesService.getSaleById).mockResolvedValue(
      crearTransaccion({
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Ver remito N° 000001'));

    expect(open).toHaveBeenCalledWith(
      '/dashboard/ventas/10/remito',
      '_blank',
      'noopener',
    );
    expect(salesService.emitirRemito).not.toHaveBeenCalled();
  });

  it('emite el remito desde el detalle y abre la vista imprimible', async () => {
    const ventana = {
      location: { href: '' },
      close: vi.fn(),
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(ventana);
    vi.mocked(salesService.getSaleById).mockResolvedValue(crearTransaccion());
    vi.mocked(salesService.emitirRemito).mockResolvedValue(documento);

    renderPagina();
    await screen.findByText('Televisor 32 pulgadas');

    abrirMenu();
    fireEvent.click(screen.getByText('Emitir remito'));

    expect(
      screen.getByText(/La numeración se asigna al confirmar/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Emitir remito/ }));

    await waitFor(() => expect(salesService.emitirRemito).toHaveBeenCalledWith(10, undefined));
    await waitFor(() =>
      expect(ventana.location.href).toBe('/dashboard/ventas/10/remito'),
    );
    abrirMenu();
    expect(await screen.findByText('Ver remito N° 000001')).toBeInTheDocument();
  });
});