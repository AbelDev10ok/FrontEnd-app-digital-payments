import { fireEvent, render, screen } from '@testing-library/react';
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
    await user.type(screen.getByLabelText(/Teléfono/), '1155551234');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: '+5491155551234' }),
    );
    expect(screen.queryByRole('alert')?.textContent).toBe('');
  });

  it('normaliza el celular cargado con 0 y 15', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText(/Nombre Completo/), 'Juan');
    await user.type(screen.getByLabelText(/DNI/), '12345678');
    await user.type(screen.getByLabelText(/Teléfono/), '011 15 5555-1234');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: '+5491155551234' }),
    );
  });

  it('acepta direcciones de hasta 120 caracteres, igual que el backend', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    const direccion = 'Av. San Martín 1234, B° Centro, CABA';

    await user.type(screen.getByLabelText(/Nombre Completo/), 'Juan');
    await user.type(screen.getByLabelText(/DNI/), '12345678');
    await user.type(screen.getByLabelText(/Teléfono/), '1155551234');
    fireEvent.change(screen.getByLabelText(/Dirección/), { target: { value: direccion } });
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByLabelText(/Dirección/)).toHaveAttribute('maxLength', '120');
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ direccion }));
  });

  it('carga localidad, provincia y código postal con el domicilio', async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();

    await user.type(screen.getByLabelText(/Nombre Completo/), 'Juan');
    await user.type(screen.getByLabelText(/DNI/), '12345678');
    await user.type(screen.getByLabelText(/Teléfono/), '1155551234');
    await user.type(screen.getByLabelText(/Dirección/), 'Av. San Martín 1234');
    await user.type(screen.getByLabelText(/Localidad/), 'Rafael Calzada');
    await user.selectOptions(screen.getByLabelText(/Provincia/), 'Buenos Aires');
    await user.type(screen.getByLabelText(/Código postal/), 'B1847');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        direccion: 'Av. San Martín 1234',
        localidad: 'Rafael Calzada',
        provincia: 'Buenos Aires',
        codigoPostal: 'B1847',
      }),
    );
  });
});
