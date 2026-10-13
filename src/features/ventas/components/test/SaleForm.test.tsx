import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SaleForm from '../SaleForm';

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
});
