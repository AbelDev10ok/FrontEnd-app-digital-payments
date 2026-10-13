import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
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
    vi.mocked(billingService.cancel).mockReset();
    vi.mocked(billingService.pause).mockReset();
    vi.mocked(billingService.resume).mockReset();
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

  it('cancela la suscripcion tras confirmar y muestra el estado cancelado', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'ACTIVE',
      subscriptionUntil: '2026-11-12',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'ACTIVE',
      currentPeriodStart: '2026-10-12',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'ACTIVE',
    });
    vi.mocked(billingService.cancel).mockResolvedValue({
      ...suscripcionBase,
      status: 'CANCELLED',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'CANCELLED',
    });

    renderPagina();

    fireEvent.click(await screen.findByRole('button', { name: /Cancelar suscripcion/i }));

    // Confirmacion: explica hasta cuando queda el acceso y el costo de volver
    expect(await screen.findByText('¿Cancelar la suscripcion?')).toBeInTheDocument();
    expect(screen.getByText(/Seguiras teniendo acceso hasta el 12\/11\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/se genera un nuevo cobro inmediato/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Si, cancelar/i }));

    await waitFor(() => expect(billingService.cancel).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
  });

  it('pausa la suscripcion y permite reactivarla', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'ACTIVE',
      subscriptionUntil: '2026-11-12',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'ACTIVE',
      currentPeriodStart: '2026-10-12',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'ACTIVE',
    });
    vi.mocked(billingService.pause).mockResolvedValue({
      ...suscripcionBase,
      status: 'PAUSED',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'PAUSED',
    });
    vi.mocked(billingService.resume).mockResolvedValue({
      ...suscripcionBase,
      status: 'ACTIVE',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'ACTIVE',
    });

    renderPagina();

    fireEvent.click(await screen.findByRole('button', { name: /Pausar suscripcion/i }));
    expect(await screen.findByText('¿Pausar la suscripcion?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Si, pausar/i }));

    await waitFor(() => expect(billingService.pause).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Suscripcion pausada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reactivar suscripcion/i }));

    await waitFor(() => expect(billingService.resume).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Suscripcion activa')).toBeInTheDocument();
  });

  it('muestra el estado cancelado con el acceso hasta la fecha y el boton de activar', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'CANCELLED',
      subscriptionUntil: '2026-11-12',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'CANCELLED',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'CANCELLED',
    });

    renderPagina();

    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
    expect(screen.getByText('Acceso hasta')).toBeInTheDocument();
    expect(screen.getAllByText('12/11/2026').length).toBeGreaterThan(0);
    expect(screen.getByText(/se genera un nuevo cobro por el mes en curso/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activar suscripcion/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar suscripcion/i })).not.toBeInTheDocument();
  });

  it('muestra el aviso de cobro rechazado con el link a MercadoPago sin cortar el acceso', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'ACTIVE',
      subscriptionUntil: '2026-11-12',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'ACTIVE',
      currentPeriodStart: '2026-10-12',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'ACTIVE',
      lastPaymentFailedAt: '2026-11-12T03:00:00',
    });

    renderPagina();

    expect(await screen.findByText('Cobro de renovacion rechazado')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Revisar medio de pago en MercadoPago/i });
    expect(link).toHaveAttribute('href', 'https://www.mercadopago.com.ar/subscriptions');
    // El rechazo no corta el acceso: la suscripcion sigue activa
    expect(screen.getByText('Suscripcion activa')).toBeInTheDocument();
  });

  it('explica la auto-cancelacion por cobros rechazados en la card de activacion', async () => {
    vi.mocked(businessService.getMyBusiness).mockResolvedValue({
      ...negocioBase,
      planStatus: 'CANCELLED',
      subscriptionUntil: '2026-11-12',
    });
    vi.mocked(billingService.getStatus).mockResolvedValue({
      ...suscripcionBase,
      status: 'CANCELLED',
      currentPeriodEnd: '2026-11-12',
      businessPlanStatus: 'CANCELLED',
      lastPaymentFailedAt: '2026-11-12T03:00:00',
    });

    renderPagina();

    expect(
      await screen.findByText(/se cancelo automaticamente tras cobros rechazados/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Cobro de renovacion rechazado')).not.toBeInTheDocument();
  });
});