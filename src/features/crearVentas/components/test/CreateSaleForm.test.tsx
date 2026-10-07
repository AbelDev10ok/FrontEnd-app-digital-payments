import { render, screen } from '@testing-library/react';
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

describe('CreateSaleForm', () => {
  it('muestra por defecto la fecha de primera cuota y el checkbox desmarcado', () => {
    render(
      <CreateSaleForm
        formData={{
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
        }}
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
});
