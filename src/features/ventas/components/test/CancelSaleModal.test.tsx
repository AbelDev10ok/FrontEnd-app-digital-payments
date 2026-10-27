import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CancelSaleModal from '../CancelSaleModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleResponseDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    cancelSale: vi.fn(),
  },
}));

const crearVenta = (overrides: Partial<SaleResponseDto> = {}): SaleResponseDto => ({
  id: 7,
  client: { id: 5, name: 'Juana Pérez', telefono: '', email: '', direccion: '', seller: false },
  descriptionProduct: 'Aire acondicionado 3200W',
  priceTotal: 100000,
  dateSale: '2026-06-01',
  finalPaymentDate: '2026-12-01',
  realFinalPayment: '',
  typePayments: 'MENSUAL',
  quantityFees: 4,
  amountFee: 25000,
  fees: [],
  cost: 80000,
  interestRate: null,
  productType: null,
  product: { id: 3, name: 'Aire acondicionado 3200W', variantId: 9 },
  quantity: 2,
  paidFeesCount: 0,
  collectedAmount: 50000,
  remainingAmount: 50000,
  totalFees: 4,
  status: 'ACTIVE',
  kind: 'VENTA',
  ...overrides,
});

const renderModal = (sale: SaleResponseDto | null, onCanceled = vi.fn()) =>
  render(
    <CancelSaleModal isOpen sale={sale} onClose={vi.fn()} onCanceled={onCanceled} />,
  );

describe('CancelSaleModal', () => {
  beforeEach(() => {
    vi.mocked(salesService.cancelSale).mockReset();
    vi.mocked(salesService.cancelSale).mockResolvedValue(crearVenta({ status: 'CANCELED' }));
  });

  it('muestra el resumen de la operación (cliente, producto y montos)', () => {
    renderModal(crearVenta());

    expect(screen.getByText('Juana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Aire acondicionado 3200W')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
  });

  it('arranca con reponer y devolver sin marcar, y los envía así', async () => {
    renderModal(crearVenta());

    expect(
      screen.getByRole('checkbox', { name: /Reponer 2 unidades al stock/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /Registrar devolución/ }),
    ).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    await waitFor(() =>
      expect(salesService.cancelSale).toHaveBeenCalledWith(7, false, false),
    );
  });

  it('envía restock y refund cuando se marcan los dos', async () => {
    renderModal(crearVenta());

    fireEvent.click(screen.getByRole('checkbox', { name: /Reponer 2 unidades al stock/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Registrar devolución/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    await waitFor(() =>
      expect(salesService.cancelSale).toHaveBeenCalledWith(7, true, true),
    );
  });

  it('no ofrece reponer stock en un préstamo', () => {
    renderModal(crearVenta({ kind: 'PRESTAMO' }));

    expect(screen.queryByRole('checkbox', { name: /Reponer/ })).not.toBeInTheDocument();
  });

  it('no ofrece reponer stock en una venta sin producto', () => {
    renderModal(crearVenta({ product: null }));

    expect(screen.queryByRole('checkbox', { name: /Reponer/ })).not.toBeInTheDocument();
  });

  it('sin cobros no ofrece devolución y lo avisa', () => {
    renderModal(crearVenta({ collectedAmount: 0 }));

    expect(
      screen.queryByRole('checkbox', { name: /devolución/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No hay cobros registrados que devolver.')).toBeInTheDocument();
  });

  it('muestra el error del backend sin cerrar el modal', async () => {
    vi.mocked(salesService.cancelSale).mockRejectedValue(
      new Error('No se puede cobrar una cuota de una venta anulada'),
    );
    renderModal(crearVenta());

    fireEvent.click(screen.getByRole('button', { name: 'Anular' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede cobrar una cuota de una venta anulada',
    );
  });
});
