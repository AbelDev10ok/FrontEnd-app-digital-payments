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
    expect(screen.getByDisplayValue('ARS')).toBeInTheDocument();
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
});