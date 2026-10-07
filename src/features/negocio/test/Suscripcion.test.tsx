import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Suscripcion from '../pages/Suscripcion';
import { businessService } from '@/features/negocio/services/businessService';
import { billingService } from '@/features/negocio/services/billingService';

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

vi.mock('@/features/negocio/services/billingService', () => ({
  billingService: {
    getStatus: vi.fn(),
    subscribe: vi.fn(),
  },
}));

const negocioBase = {
  id: 7,
  name: 'Cobros del Sur',
  currency: 'ARS',
  planStatus: 'TRIAL' as const,
  trialEndsAt: null as string | null,
  subscriptionUntil: null as string | null,
  defaultInterestRate: null,
  defaultPaymentFrequency: null,
  createdAt: null as string | null,
};

const suscripcionBase = {
  id: 1,
  status: 'TRIALING',
  plan: {
    id: 1,
    name: 'Plan Mensual',
    description: 'Gestion de Cobros y Ventas - Suscripcion mensual',
    price: 15000,
    currency: 'ARS',
    trialDays: 14,
  },
  trialEndsAt: null as string | null,
  businessPlanStatus: 'TRIAL',
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Suscripcion user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('Suscripcion', () => {
  beforeEach(() => {
    vi.mocked(businessService.getMyBusiness).mockReset();
    vi.mocked(billingService.getStatus).mockReset();
  });

  it('muestra el trial con los dias restantes y el boton de activar', async () => {
    const en30Dias = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      trialEndsAt: en30Dias,
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      trialEndsAt: en30Dias,
    });

    renderPagina();

    expect(await screen.findByText('Prueba gratuita')).toBeInTheDocument();
    expect(screen.getByText(/días restantes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activar suscripcion/i })).not.toBeDisabled();
  });

  it('muestra el plan activo con la fecha de vencimiento', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'ACTIVE',
      subscriptionUntil: '2026-09-30',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'ACTIVE',
      currentPeriodStart: '2026-09-01',
      currentPeriodEnd: '2026-09-30',
      businessPlanStatus: 'ACTIVE',
    });

    renderPagina();

    expect(await screen.findByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Suscripcion activa')).toBeInTheDocument();
    expect(screen.getAllByText('30/09/2026').length).toBeGreaterThan(0);
  });
});