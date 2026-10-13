import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ClientForm from '../ClientForm';

vi.mock('@features/clients/services/clientServices', () => ({
  clientService: {
    getVendedoresActivos: vi.fn().mockResolvedValue([]),
  },
}));

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <MemoryRouter>
      <ClientForm onSubmit={onSubmit} loading={false} submitLabel="Guardar" cancelTo="/clientes" />
    </MemoryRouter>,
  );
  return onSubmit;
};

describe('ClientForm', () => {
  it('tras un envío fallido enfoca el primer campo inválido y anuncia los errores', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Nombre Completo/)).toHaveFocus();
    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent('Hay 3 errores en el formulario');
    expect(aviso).toHaveTextContent('El nombre es obligatorio');
  });

  it('marca cada campo inválido con aria-invalid y lo asocia con su error', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    const dni = screen.getByLabelText(/DNI/);
    expect(dni).toHaveAttribute('aria-invalid', 'true');
    const errorDni = screen.getByText('El DNI debe contener solo números y tener entre 7 y 8 dígitos');
    expect(dni.getAttribute('aria-describedby')).toBe(errorDni.id);
  });

  it('envía el formulario cuando la validación pasa', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText(/Nombre Completo/), 'Juan');
    await user.type(screen.getByLabelText(/DNI/), '12345678');
    await user.type(screen.getByLabelText(/Teléfono/), '0981123456');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')?.textContent).toBe('');
  });
});
