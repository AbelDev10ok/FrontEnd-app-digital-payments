import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InfoTransactionDetalle from '../InfoTransactionDetalle';
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

const formatDate = (date: string) => date;

describe('InfoTransactionDetalle', () => {
  it('muestra Fecha de anulación cuando la transacción está CANCELADA', () => {
    render(
      <InfoTransactionDetalle
        transaction={crearTransaccion({ status: 'CANCELED', remainingAmount: 0 })}
        isLoan={false}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByText('Fecha de anulación')).toBeInTheDocument();
    expect(screen.getByText('2026-08-15')).toBeInTheDocument();
    expect(screen.queryByText('Fecha Finalización de Venta')).not.toBeInTheDocument();
  });

  it('muestra Fecha Finalización de Venta cuando la transacción está completada', () => {
    render(
      <InfoTransactionDetalle
        transaction={crearTransaccion({ status: 'COMPLETED', remainingAmount: 0 })}
        isLoan={false}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByText('Fecha Finalización de Venta')).toBeInTheDocument();
    expect(screen.queryByText('Fecha de anulación')).not.toBeInTheDocument();
  });

  it('etiqueta correctamente la fecha según sea préstamo o venta', () => {
    render(
      <InfoTransactionDetalle
        transaction={crearTransaccion()}
        isLoan={true}
        formatDate={formatDate}
      />,
    );

    expect(screen.getByText('Fecha de Préstamo')).toBeInTheDocument();
  });
});