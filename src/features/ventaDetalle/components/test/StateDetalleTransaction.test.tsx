import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StateDetalleTransaction from '../StateDetalleTransaction';
import type { SaleResponseDto } from '@/shared/types/sales';

const crearTransaccion = (overrides: Partial<SaleResponseDto> = {}): SaleResponseDto => ({
  id: 10,
  client: { id: 5, name: 'Juana Pérez', telefono: '', email: '', direccion: '', seller: false },
  descriptionProduct: 'Televisor 32 pulgadas',
  priceTotal: 60000,
  dateSale: '2026-06-01',
  finalPaymentDate: '2026-12-01',
  realFinalPayment: '2026-08-15',
  typePayments: 'MENSUAL',
  quantityFees: 4,
  amountFee: 15000,
  fees: [],
  cost: 50000,
  interestRate: null,
  productType: null,
  paidFeesCount: 0,
  remainingAmount: 60000,
  collectedAmount: 0,
  refundAmount: 0,
  totalFees: 4,
  status: 'ACTIVE',
  kind: 'VENTA',
  ...overrides,
});

const formatCurrency = (amount: number) => `$${amount}`;

describe('StateDetalleTransaction', () => {
  it('muestra Cobrado y A devolver al cliente cuando la anulación devuelve el monto', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({
          status: 'CANCELED',
          remainingAmount: 0,
          collectedAmount: 100,
          refundAmount: 100,
        })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(screen.getByText('Cobrado antes de anular')).toBeInTheDocument();
    expect(screen.getByText('A devolver al cliente')).toBeInTheDocument();
    expect(screen.getAllByText('$100').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Deuda Pendiente')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('muestra Monto conservado cuando la anulación retiene el monto', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({
          status: 'CANCELED',
          remainingAmount: 0,
          collectedAmount: 100,
          refundAmount: 0,
        })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(screen.getByText('Monto conservado')).toBeInTheDocument();
    expect(screen.getAllByText('$100').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('A devolver al cliente')).not.toBeInTheDocument();
    expect(screen.getByText('Deuda Pendiente')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('muestra la auditoría de la anulación cuando está registrada', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({
          status: 'CANCELED',
          remainingAmount: 0,
          collectedAmount: 100,
          refundAmount: 100,
          canceledAt: '2026-10-27T18:30:00',
          canceledBy: 'duena@negocio.com',
          cancelReason: 'El cliente devolvió el producto',
        })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(
      screen.getByText(
        /Anulada el 27\/10\/2026 · 18:30 por duena@negocio\.com — Motivo: El cliente devolvió el producto/,
      ),
    ).toBeInTheDocument();
  });

  it('no muestra la línea de auditoría en una anulación sin datos registrados', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({
          status: 'CANCELED',
          remainingAmount: 0,
          collectedAmount: 100,
          refundAmount: 100,
        })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(
      screen.queryByText(/Anulada el|Anulación registrada/),
    ).not.toBeInTheDocument();
  });

  it('no muestra Ganancia Esperada ni Monto Pendiente en una anulación', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({
          status: 'CANCELED',
          remainingAmount: 0,
          collectedAmount: 100,
          refundAmount: 100,
        })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(screen.queryByText('Ganancia Esperada')).not.toBeInTheDocument();
    expect(screen.queryByText('Monto Pendiente')).not.toBeInTheDocument();
  });

  it('mantiene los montos estándar para ventas activas', () => {
    render(
      <StateDetalleTransaction
        transaction={crearTransaccion({ status: 'ACTIVE', remainingAmount: 60000 })}
        formatCurrency={formatCurrency}
      />,
    );

    expect(screen.getByText('Monto Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Ganancia Esperada')).toBeInTheDocument();
    expect(screen.queryByText('Cobrado antes de anular')).not.toBeInTheDocument();
    expect(screen.queryByText('Deuda Pendiente')).not.toBeInTheDocument();
  });

  it('en móvil deja la economía detrás de "Ver detalles"', () => {
    const { rerender } = render(
      <StateDetalleTransaction
        transaction={crearTransaccion({ status: 'ACTIVE' })}
        formatCurrency={formatCurrency}
        showDetails={false}
      />,
    );

    // El bloque se esconde sólo por debajo de `sm`: en escritorio sigue visible
    // (jsdom no aplica media queries, así que se verifica el contrato de clases).
    expect(screen.getByText('Monto Total')).toBeInTheDocument();
    expect(screen.getByText('Monto Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Ganancia Esperada').closest('.hidden')).toHaveClass(
      'hidden',
      'sm:contents',
    );

    rerender(
      <StateDetalleTransaction
        transaction={crearTransaccion({ status: 'ACTIVE' })}
        formatCurrency={formatCurrency}
        showDetails
      />,
    );

    expect(screen.getByText('Ganancia Esperada').closest('.hidden')).toBeNull();
  });
});