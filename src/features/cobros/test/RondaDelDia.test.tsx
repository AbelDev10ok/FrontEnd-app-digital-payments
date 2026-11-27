import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RondaDelDia from '../pages/RondaDelDia';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import type { RoundResponse } from '@/shared/types/business';

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    getRound: vi.fn(),
    marcarVisitaRonda: vi.fn(),
    payClient: vi.fn(),
  },
}));

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getSellers: vi.fn().mockResolvedValue([]),
    getProductTypes: vi.fn().mockResolvedValue([]),
    getSalesCounts: vi.fn().mockResolvedValue({
      ventas: 0,
      prestamos: 0,
      cuotas: 0,
      clientes: 0,
    }),
  },
}));

const ronda = (overrides: Partial<RoundResponse> = {}): RoundResponse => ({
  id: 1,
  fecha: '2026-11-18',
  items: [
    {
      id: 1,
      position: 1,
      clientId: 5,
      clientName: 'Rosa Diaz',
      clientPhone: '+5491155551234',
      clientAddress: 'Av. Siempre Viva 123',
      currency: 'ARS',
      amount: 30000,
      pendingAmount: 30000,
      daysOverdue: 12,
      estado: 'PENDIENTE',
    },
    {
      id: 2,
      position: 2,
      clientId: 6,
      clientName: 'Juan Demo',
      clientPhone: null,
      clientAddress: null,
      currency: 'USD',
      amount: 300,
      pendingAmount: 300,
      daysOverdue: 0,
      estado: 'PENDIENTE',
      promiseId: 9,
      promiseDate: '2026-11-10',
      promiseOverdue: true,
    },
    {
      id: 3,
      position: 3,
      clientId: 7,
      clientName: 'Ana Gomez',
      clientPhone: null,
      clientAddress: null,
      currency: 'ARS',
      amount: 5000,
      pendingAmount: null,
      daysOverdue: 0,
      estado: 'COBRADO',
    },
  ],
  ...overrides,
});

const renderPagina = () =>
  render(
    <MemoryRouter>
      <RondaDelDia user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

const filasDeLaRonda = () => {
  const lista = screen.getByText('Rosa Diaz').closest('ul');
  if (!lista) throw new Error('No se encontró la lista de la ronda');
  return within(lista).getAllByRole('listitem');
};

describe('RondaDelDia', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.getRound).mockReset();
    vi.mocked(collectionsService.marcarVisitaRonda).mockReset();
    vi.mocked(collectionsService.payClient).mockReset();
  });

  it('muestra las paradas en el orden del plan', async () => {
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());

    renderPagina();

    expect(await screen.findByText('Rosa Diaz')).toBeInTheDocument();
    const filas = filasDeLaRonda();
    expect(filas).toHaveLength(3);
    expect(filas[0]).toHaveTextContent('Rosa Diaz');
    expect(filas[1]).toHaveTextContent('Juan Demo');
    expect(filas[2]).toHaveTextContent('Ana Gomez');
  });

  it('resume planificado y por cobrar sin mezclar monedas', async () => {
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());

    renderPagina();

    expect(await screen.findByText('Paradas')).toBeInTheDocument();
    expect(screen.getByText('2 pendientes · 1 cobradas · 0 sin visita')).toBeInTheDocument();
    expect(screen.getByText('Planificado').parentElement).toHaveTextContent('35.000');
    expect(screen.getByText('Planificado').parentElement).toHaveTextContent('300');
    expect(screen.getByText('Por cobrar').parentElement).toHaveTextContent('30.000');
    expect(screen.getByText('Por cobrar').parentElement).toHaveTextContent('300');
  });

  it('muestra la promesa vencida de la parada', async () => {
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());

    renderPagina();

    expect(await screen.findByText(/Promesa vencida/)).toBeInTheDocument();
  });

  it('marca una parada como no estaba y refresca la ronda', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());
    vi.mocked(collectionsService.marcarVisitaRonda).mockResolvedValue(
      ronda({
        items: ronda().items.map((item) =>
          item.id === 1 ? { ...item, estado: 'NO_ESTABA' } : item,
        ),
      }),
    );

    renderPagina();

    await screen.findByText('Rosa Diaz');
    const fila = filasDeLaRonda()[0];
    await user.click(within(fila).getByRole('button', { name: 'No estaba' }));

    expect(collectionsService.marcarVisitaRonda).toHaveBeenCalledWith(1, { noEstaba: true });
    // La página aplica la respuesta del servidor sin refetch: no hay segunda llamada.
    await screen.findByRole('button', { name: 'Deshacer' });
    expect(collectionsService.getRound).toHaveBeenCalledTimes(1);
    const filaActualizada = filasDeLaRonda()[0];
    expect(within(filaActualizada).getByText('No estaba')).toBeInTheDocument();
    expect(within(filaActualizada).getByRole('button', { name: 'Deshacer' })).toBeInTheDocument();
  });

  it('oculta las paradas cobradas cuando se pide', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());

    renderPagina();

    await screen.findByText('Ana Gomez');
    await user.click(screen.getByRole('checkbox', { name: /Ocultar cobrados/i }));

    expect(screen.queryByText('Ana Gomez')).not.toBeInTheDocument();
    expect(screen.getByText('Rosa Diaz')).toBeInTheDocument();
    expect(screen.getByText('Juan Demo')).toBeInTheDocument();
  });

  it('abre el cobro por cliente con el monto pendiente de la parada', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getRound).mockResolvedValue(ronda());

    renderPagina();

    await screen.findByText('Rosa Diaz');
    const fila = filasDeLaRonda()[0];
    await user.click(within(fila).getByRole('button', { name: 'Cobrar' }));

    expect(screen.getByRole('dialog', { name: 'Cobrar todo · Rosa Diaz' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(30000);
  });

  it('muestra el error del backend y no inventa una ronda', async () => {
    vi.mocked(collectionsService.getRound).mockRejectedValue(new Error('Error al cargar la ronda'));

    renderPagina();

    expect(await screen.findByText('Error al cargar la ronda')).toBeInTheDocument();
    expect(screen.queryByText('Rosa Diaz')).not.toBeInTheDocument();
  });
});
