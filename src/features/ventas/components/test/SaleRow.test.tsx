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

const renderFila = (sale: SaleResponseDto) => {
  const onEdit = vi.fn();
  const onRemito = vi.fn();
  const onCancel = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <SaleRow
            sale={sale}
            selectedStatus="TODAS"
            onEdit={onEdit}
            onRemito={onRemito}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        </tbody>
      </table>
    </MemoryRouter>,
  );
  return { onEdit, onRemito, onCancel, onDelete };
};

const abrirMenu = (tipo: 'venta' | 'préstamo' = 'venta') =>
  fireEvent.click(screen.getByRole('button', { name: `Acciones de la ${tipo} #10` }));

describe('SaleRow', () => {
  it('ofrece ver el detalle con el ojo, como en Cuotas', () => {
    renderFila(crearVenta());

    const ver = screen.getByRole('link', { name: 'Ver detalle de la venta #10' });
    expect(ver).toHaveAttribute('href', '/dashboard/ventas/10');
  });

  it('agrupa Editar, Remito, Anular y Eliminar en el menú de acciones', () => {
    const { onEdit, onRemito, onCancel, onDelete } = renderFila(crearVenta());

    abrirMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));

    abrirMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Emitir remito' }));
    expect(onRemito).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));

    abrirMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Anular venta' }));
    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));

    abrirMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it('indica el número cuando la venta ya tiene remito', () => {
    renderFila(
      crearVenta({
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    abrirMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Ver remito N° 000001' }),
    ).toBeInTheDocument();
  });

  it('no ofrece remito para préstamos y anula con su nombre', () => {
    renderFila(crearVenta({ kind: 'PRESTAMO' }));

    abrirMenu('préstamo');

    expect(screen.queryByRole('menuitem', { name: /remito/i })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Anular préstamo' })).toBeInTheDocument();
  });

  it('no ofrece editar ni emitir remito de una venta anulada sin remito', () => {
    renderFila(crearVenta({ status: 'CANCELED' }));

    abrirMenu();

    // Una venta anulada es terminal: no se edita ni se anula de nuevo
    expect(screen.queryByRole('menuitem', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /remito/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /anular/i })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('permite ver el remito de una venta anulada que ya lo tenía', () => {
    renderFila(
      crearVenta({
        status: 'CANCELED',
        remito: { id: 1, number: 1, numberLabel: '000001', issuedAt: '2026-06-02T10:00:00' },
      }),
    );

    abrirMenu();

    expect(
      screen.getByRole('menuitem', { name: 'Ver remito N° 000001' }),
    ).toBeInTheDocument();
  });

  it('oculta Eliminar cuando la venta ya tiene cobros, aunque sean parciales', () => {
    // Una cuota con pago parcial no suma a paidFeesCount, pero sí a lo cobrado:
    // el backend rechaza eliminar cualquier venta con pagos registrados.
    renderFila(crearVenta({ paidFeesCount: 0, collectedAmount: 5000 }));

    abrirMenu();

    expect(screen.queryByRole('menuitem', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Anular venta' })).toBeInTheDocument();
  });
});
