import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import SaleRow from '../SaleRow';
import type { SaleResponseDto } from '@/shared/types/sales';

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

const renderFila = (sale: SaleResponseDto, onRemito = vi.fn()) =>
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <SaleRow sale={sale} selectedStatus="TODAS" onRemito={onRemito} />
        </tbody>
      </table>
    </MemoryRouter>,
  );

describe('SaleRow', () => {
  it('ofrece emitir el remito de una venta sin remito', () => {
    const onRemito = vi.fn();
    renderFila(crearVenta(), onRemito);

    const boton = screen.getByRole('button', { name: 'Emitir remito' });
    fireEvent.click(boton);

    expect(onRemito).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it('indica el número cuando la venta ya tiene remito', () => {
    renderFila(
      crearVenta({
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    expect(
      screen.getByRole('button', { name: 'Ver remito N° 000001' }),
    ).toBeInTheDocument();
  });

  it('no ofrece remito para préstamos', () => {
    renderFila(crearVenta({ kind: 'PRESTAMO' }));

    expect(screen.queryByRole('button', { name: /remito/i })).not.toBeInTheDocument();
  });

  it('no ofrece emitir remito de una venta anulada sin remito', () => {
    renderFila(crearVenta({ status: 'CANCELED' }));

    expect(screen.queryByRole('button', { name: /remito/i })).not.toBeInTheDocument();
  });

  it('permite ver el remito de una venta anulada que ya lo tenía', () => {
    renderFila(
      crearVenta({
        status: 'CANCELED',
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    expect(
      screen.getByRole('button', { name: 'Ver remito N° 000001' }),
    ).toBeInTheDocument();
  });
});
