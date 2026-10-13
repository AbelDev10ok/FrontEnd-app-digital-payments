import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CreateSaleForm from '../CreateSaleForm';

vi.mock('@/shared/components/AutocompleteSeller', () => ({
  default: () => <div>Vendedor</div>,
}));

vi.mock('@/features/crearVentas/components/AutocompleteClient', () => ({
  default: () => <div>Cliente</div>,
}));

vi.mock('@/features/crearVentas/components/SubmitBar', () => ({
  default: () => <button type="submit">Guardar</button>,
}));

const baseFormData = {
  tipo: 'PRESTAMO',
  fecha: '2026-10-03',
  firstFeeDate: '2026-10-03',
  payFirstFee: false,
  firstFeeAmount: '',
  payments: 'SEMANAL',
  quantityFees: 4,
  amountFee: 100,
  cost: 300,
  interestRate: 10,
  cliente: 0,
  sellerId: '',
};

describe('CreateSaleForm', () => {
  it('muestra por defecto la fecha de primera cuota y el checkbox desmarcado', () => {
    render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Fecha del primer pago')).toHaveValue('2026-10-03');
    expect(screen.getByRole('checkbox', { name: /Pagar primera cuota ahora/i })).not.toBeChecked();
  });

  it('muestra el error de envío y le da foco', () => {
    render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
        submitError="No se pudo guardar la transacción. Intentá nuevamente."
      />,
    );

    const mensaje = screen.getByText('No se pudo guardar la transacción. Intentá nuevamente.');
    const foco = mensaje.closest('[tabindex="-1"]');
    expect(foco).not.toBeNull();
    expect(foco).toHaveFocus();
  });

  it('anuncia los errores de validación tras un envío fallido', () => {
    const { container } = render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{ cliente: 'Selecciona un cliente' }}
        isSubmittingDisabled
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.submit(container.querySelector('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Hay 1 error en el formulario: Selecciona un cliente.');
  });
});
