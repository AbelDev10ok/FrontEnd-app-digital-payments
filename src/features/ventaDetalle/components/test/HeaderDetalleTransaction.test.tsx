import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import HeaderDetalleTransaction from '../HeaderDetalleTransaction';
import type { SaleResponseDto } from '@/shared/types/sales';

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

const renderConMocks = (onEdit = vi.fn(), onDelete = vi.fn(), onCancel = vi.fn(), transaction?: SaleResponseDto, canDelete = true) => {
  const utils = render(
    <MemoryRouter>
      <HeaderDetalleTransaction
        transaction={transaction ?? crearTransaccion()}
        onEdit={onEdit}
        onDelete={onDelete}
        onCancel={onCancel}
        canDelete={canDelete}
      />
    </MemoryRouter>,
  );
  return { onEdit, onDelete, onCancel, ...utils };
};

const abrirMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Opciones de la transacción' }));
};

describe('HeaderDetalleTransaction', () => {
  it('muestra las opciones Editar, Anular y Eliminar en una venta sin pagos', () => {
    renderConMocks();
    abrirMenu();

    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Anular venta')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.queryByText('Recrear venta')).not.toBeInTheDocument();
  });

  it('oculta Eliminar cuando la venta tiene cuotas pagadas (canDelete false)', () => {
    renderConMocks(vi.fn(), vi.fn(), vi.fn(), crearTransaccion({ paidFeesCount: 2 }), false);
    abrirMenu();

    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    expect(screen.getByText('Anular venta')).toBeInTheDocument();
  });

  it('oculta Anular venta cuando la transacción ya está CANCELADA', () => {
    renderConMocks(vi.fn(), vi.fn(), vi.fn(), crearTransaccion({ status: 'CANCELED' }));
    abrirMenu();

    expect(screen.queryByText('Anular venta')).not.toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('no renderiza Anular ni Eliminar si no se pasan sus handlers', () => {
    render(
      <MemoryRouter>
        <HeaderDetalleTransaction
          transaction={crearTransaccion()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </MemoryRouter>,
    );
    abrirMenu();

    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.queryByText('Anular venta')).not.toBeInTheDocument();
    expect(screen.queryByText('Recrear venta')).not.toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('invoca onEdit, onCancel y onDelete con sus opciones', () => {
    const { onEdit, onDelete, onCancel } = renderConMocks();

    abrirMenu();
    fireEvent.click(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalled();

    abrirMenu();
    fireEvent.click(screen.getByText('Anular venta'));
    expect(onCancel).toHaveBeenCalled();

    abrirMenu();
    fireEvent.click(screen.getByText('Eliminar'));
    expect(onDelete).toHaveBeenCalled();
  });
});