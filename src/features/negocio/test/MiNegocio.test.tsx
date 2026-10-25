import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MiNegocio from '../pages/MiNegocio';
import { businessService } from '@/features/negocio/services/businessService';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn().mockResolvedValue([]),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    }),
  },
}));

vi.mock('@/features/negocio/services/businessService', () => ({
  businessService: {
    getMyBusiness: vi.fn(),
    updateMyBusiness: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const negocio = {
  id: 7,
  name: 'Cobros del Sur',
  cuit: '20123456789',
  address: 'Av. Siempre Viva 123',
  phone: '1144556677',
  currency: 'ARS',
  defaultInterestRate: null,
  defaultPaymentFrequency: null,
  planStatus: 'TRIAL' as const,
  trialEndsAt: '2026-09-15',
  subscriptionUntil: null,
  createdAt: '2026-08-16',
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <MiNegocio user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('MiNegocio', () => {
  beforeEach(() => {
    vi.mocked(businessService.getMyBusiness).mockReset();
    vi.mocked(businessService.updateMyBusiness).mockReset();
    vi.mocked(businessService.changePassword).mockReset();
    vi.mocked(businessService.getMyBusiness).mockResolvedValue(negocio);
  });

  it('carga los datos del negocio en el formulario', async () => {
    renderPagina();

    expect(await screen.findByDisplayValue('Cobros del Sur')).toBeInTheDocument();
    expect(screen.getByLabelText(/CUIT/)).toHaveValue('20123456789');
    expect(screen.getByLabelText(/Dirección/)).toHaveValue('Av. Siempre Viva 123');
    expect(screen.getByLabelText(/Teléfono/)).toHaveValue('1144556677');
    expect(screen.getByRole('combobox', { name: 'Moneda predeterminada' })).toHaveValue('ARS');
  });

  it('ofrece solo ARS y USD como moneda predeterminada', async () => {
    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    const moneda = screen.getByRole('combobox', { name: 'Moneda predeterminada' });
    const opciones = Array.from(moneda.querySelectorAll('option')).map((o) => o.value);

    expect(opciones).toEqual(['ARS', 'USD']);
  });

  it('guarda la moneda predeterminada elegida', async () => {
    const user = userEvent.setup();
    vi.mocked(businessService.updateMyBusiness).mockResolvedValue({ ...negocio, currency: 'USD' });

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda predeterminada' }), 'USD');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(businessService.updateMyBusiness).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD' }),
      ),
    );
  });

  it('explica el alcance de la moneda predeterminada', async () => {
    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    expect(
      screen.getByText(
        'Se preselecciona al crear productos y préstamos. Podés elegir otra en cada alta. No modifica las operaciones existentes.',
      ),
    ).toBeInTheDocument();
  });

  it('conserva una moneda legada fuera de la lista para no dejar el select vacío', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({ ...negocio, currency: 'PYG' });

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    const moneda = screen.getByRole('combobox', { name: 'Moneda predeterminada' });
    const opciones = Array.from(moneda.querySelectorAll('option')).map((o) => o.value);

    expect(opciones).toEqual(['ARS', 'USD', 'PYG']);
    expect(moneda).toHaveValue('PYG');
  });

  it('guarda los datos del negocio', async () => {
    const user = userEvent.setup();
    vi.mocked(businessService.updateMyBusiness).mockResolvedValue({
      ...negocio,
      name: 'Nuevo Nombre',
      defaultInterestRate: 12.5,
      defaultPaymentFrequency: 'MENSUAL',
    });

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    await user.clear(screen.getByLabelText(/Nombre del negocio/));
    await user.type(screen.getByLabelText(/Nombre del negocio/), 'Nuevo Nombre');
    await user.type(screen.getByLabelText('Tasa de interés (%)'), '12.5');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(businessService.updateMyBusiness).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Nuevo Nombre' }),
      ),
    );
    expect(await screen.findByText('Cambios guardados correctamente.')).toBeInTheDocument();
  });

  it('cambia la contraseña e informa que se cerraron las otras sesiones', async () => {
    const user = userEvent.setup();
    vi.mocked(businessService.changePassword).mockResolvedValue(
      'Contraseña actualizada. Las demás sesiones fueron cerradas.',
    );

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    await user.type(screen.getByLabelText(/Contraseña actual/), 'ClaveVieja1');
    await user.type(screen.getByLabelText(/Nueva contraseña/), 'ClaveNueva123');
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));

    await waitFor(() =>
      expect(businessService.changePassword).toHaveBeenCalledWith('ClaveVieja1', 'ClaveNueva123'),
    );
    expect(
      await screen.findByText('Contraseña actualizada. Las demás sesiones fueron cerradas.'),
    ).toBeInTheDocument();
  });

  it('valida el largo mínimo de la nueva contraseña sin llamar al backend', async () => {
    const user = userEvent.setup();
    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    await user.type(screen.getByLabelText(/Contraseña actual/), 'ClaveVieja1');
    await user.type(screen.getByLabelText(/Nueva contraseña/), 'corta');
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));

    expect(await screen.findByText(/al menos 8 caracteres/)).toBeInTheDocument();
    expect(businessService.changePassword).not.toHaveBeenCalled();
  });

  it('guarda el CUIT, la dirección y el teléfono que se imprimen en los remitos', async () => {
    const user = userEvent.setup();
    vi.mocked(businessService.updateMyBusiness).mockResolvedValue({
      ...negocio,
      cuit: '20999999999',
      address: 'Nueva dirección 456',
      phone: '11 5555-6666',
    });

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    const cuit = screen.getByLabelText(/CUIT/);
    await user.clear(cuit);
    await user.type(cuit, '20999999999');
    const direccion = screen.getByLabelText(/Dirección/);
    await user.clear(direccion);
    await user.type(direccion, 'Nueva dirección 456');
    const telefono = screen.getByLabelText(/Teléfono/);
    await user.clear(telefono);
    await user.type(telefono, '11 5555-6666');

    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(businessService.updateMyBusiness).toHaveBeenCalledWith(
        expect.objectContaining({
          cuit: '20999999999',
          address: 'Nueva dirección 456',
          phone: '11 5555-6666',
        }),
      ),
    );
  });

  it('permite borrar los datos opcionales enviando campos vacíos', async () => {
    const user = userEvent.setup();
    vi.mocked(businessService.updateMyBusiness).mockResolvedValue({
      ...negocio,
      cuit: null,
      address: null,
      phone: null,
    });

    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    await user.clear(screen.getByLabelText(/CUIT/));
    await user.clear(screen.getByLabelText(/Dirección/));
    await user.clear(screen.getByLabelText(/Teléfono/));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(businessService.updateMyBusiness).toHaveBeenCalledWith(
        expect.objectContaining({ cuit: '', address: '', phone: '' }),
      ),
    );
  });

  it('rechaza un CUIT que no tiene 11 dígitos sin llamar al backend', async () => {
    const user = userEvent.setup();
    renderPagina();
    await screen.findByDisplayValue('Cobros del Sur');

    const cuit = screen.getByLabelText(/CUIT/);
    await user.clear(cuit);
    await user.type(cuit, '123');

    await user.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    expect(
      await screen.findByText('El CUIT debe tener 11 dígitos, sin guiones.'),
    ).toBeInTheDocument();
    expect(businessService.updateMyBusiness).not.toHaveBeenCalled();
  });
});