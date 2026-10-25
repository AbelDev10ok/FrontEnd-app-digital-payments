import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SaleForm from '../SaleForm';
import type { SaleResponseDto } from '@/shared/types/sales';

const ventaEnDolares = {
  id: 1,
  client: { id: 1, name: 'Ana', telefono: '123' },
  descriptionProduct: 'a17',
  priceTotal: 350,
  dateSale: '2026-10-01',
  finalPaymentDate: '2026-11-01',
  realFinalPayment: '',
  typePayments: 'MENSUAL',
  quantityFees: 1,
  amountFee: 350,
  fees: [],
  cost: 350,
  interestRate: null,
  productType: null,
  paidFeesCount: 0,
  remainingAmount: 350,
  totalFees: 1,
  kind: 'VENTA',
  currency: 'USD',
} as unknown as SaleResponseDto;

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <MemoryRouter>
      <SaleForm
        onSubmit={onSubmit}
        loading={false}
        submitLabel="Guardar"
        cancelTo="/dashboard/ventas/todas"
        productTypes={[]}
      />
    </MemoryRouter>,
  );
  return onSubmit;
};

describe('SaleForm', () => {
  it('tras un envío fallido enfoca el primer campo inválido y anuncia los errores', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Descripción del Producto/)).toHaveFocus();
    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent('errores en el formulario');
    expect(aviso).toHaveTextContent('La descripción es obligatoria');
  });

  it('marca cada campo inválido con aria-invalid y lo asocia con su error', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    const descripcion = screen.getByLabelText(/Descripción del Producto/);
    expect(descripcion).toHaveAttribute('aria-invalid', 'true');
    const errorDescripcion = screen.getByText('La descripción es obligatoria');
    expect(descripcion.getAttribute('aria-describedby')).toBe(errorDescripcion.id);
  });

  it('usa el símbolo de la moneda de la venta en los montos editables', () => {
    render(
      <MemoryRouter>
        <SaleForm
          initialValues={ventaEnDolares}
          onSubmit={vi.fn()}
          loading={false}
          submitLabel="Guardar"
          cancelTo="/dashboard/ventas/todas"
          productTypes={[]}
        />
      </MemoryRouter>,
    );

    const monto = screen.getByLabelText(/Monto de Cuota/);
    expect(monto.parentElement?.querySelector('span')?.textContent).toBe('US$');

    const costo = screen.getByLabelText(/Costo/);
    expect(costo.parentElement?.querySelector('span')?.textContent).toBe('US$');
  });
});
