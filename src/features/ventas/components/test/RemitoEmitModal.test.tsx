import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RemitoEmitModal from '../RemitoEmitModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleDocumentDto, SaleResponseDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    emitirRemito: vi.fn(),
  },
}));

const crearVenta = (overrides: Partial<SaleResponseDto> = {}): SaleResponseDto => ({
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
  notes: 'Entregar',
};

const ventanaImpresion = {
  location: { href: '' },
  close: vi.fn(),
} as unknown as Window;

const renderModal = (onEmitted = vi.fn(), onClose = vi.fn()) =>
  render(
    <RemitoEmitModal
      isOpen
      sale={crearVenta()}
      onClose={onClose}
      onEmitted={onEmitted}
    />,
  );

describe('RemitoEmitModal', () => {
  beforeEach(() => {
    vi.mocked(salesService.emitirRemito).mockReset();
    vi.spyOn(window, 'open').mockReturnValue(ventanaImpresion);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('avisa que la numeración se asigna al confirmar y ofrece observaciones opcionales', () => {
    renderModal();

    expect(screen.getByText(/La numeración se asigna al confirmar/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Observaciones \(opcional\)/)).toBeInTheDocument();
    expect(screen.getByText('#10')).toBeInTheDocument();
  });

  it('emite el remito con las observaciones y abre la vista de impresión', async () => {
    vi.mocked(salesService.emitirRemito).mockResolvedValue(documento);
    const onEmitted = vi.fn();

    renderModal(onEmitted);

    fireEvent.change(screen.getByLabelText(/Observaciones \(opcional\)/), {
      target: { value: '  Entregar por la tarde  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Emitir remito/ }));

    await waitFor(() =>
      expect(salesService.emitirRemito).toHaveBeenCalledWith(10, 'Entregar por la tarde'),
    );
    await waitFor(() =>
      expect(onEmitted).toHaveBeenCalledWith(documento, ventanaImpresion),
    );
  });

  it('emite sin observaciones cuando el campo queda vacío', async () => {
    vi.mocked(salesService.emitirRemito).mockResolvedValue(documento);

    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /Emitir remito/ }));

    await waitFor(() => expect(salesService.emitirRemito).toHaveBeenCalledWith(10, undefined));
  });

  it('muestra el error del backend y cierra la pestaña en blanco si falla', async () => {
    vi.mocked(salesService.emitirRemito).mockRejectedValue(
      new Error('No se puede emitir un remito de una venta anulada'),
    );
    const onEmitted = vi.fn();

    renderModal(onEmitted);

    fireEvent.click(screen.getByRole('button', { name: /Emitir remito/ }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('No se puede emitir un remito de una venta anulada');
    expect(ventanaImpresion.close).toHaveBeenCalled();
    expect(onEmitted).not.toHaveBeenCalled();
  });
});
