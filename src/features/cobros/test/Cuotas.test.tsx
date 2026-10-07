import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Cuotas from '../pages/Cuotas';
import { collectionsService } from '@/features/cobros/services/collectionsService';

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
    markFeeAsPaid: vi.fn(),
  },
}));

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    getCobrosHoy: vi.fn(),
    getCuotas: vi.fn(),
  },
}));

const cuota = {
  id: 10,
  saleId: 2,
  clientId: 3,
  clientName: 'Maria Lopez',
  saleDescription: 'Televisor 32 pulgadas',
  saleKind: 'VENTA' as const,
  numeroCuota: 1,
  totalCuotas: 12,
  monto: 15000,
  fechaVencimiento: '2026-08-25',
  pagada: false,
  diasAtraso: 0,
  estado: 'TODAY' as const,
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Cuotas user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('Cuotas', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.getCuotas).mockReset();
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [cuota],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    } as never);
  });

  it('lista las cuotas con cliente, estado y monto', async () => {
    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('Vence hoy')).toBeInTheDocument();
    expect(screen.getByText('$ 15.000')).toBeInTheDocument();
    // El botón de cobro aparece para cuotas no pagadas
    expect(screen.getByRole('button', { name: /Cobrar/ })).toBeInTheDocument();
  });

  it('pide el filtro de vencidas al cambiar el select de estado', async () => {
    const user = userEvent.setup();
    renderPagina();

    await screen.findByText('Maria Lopez');
    await user.selectOptions(screen.getByLabelText('Estado'), 'DELAYED');

    await waitFor(() =>
      expect(collectionsService.getCuotas).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'DELAYED', page: 0 }),
      ),
    );
  });

  it('muestra el estado vacío sin resultados', async () => {
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [],
      totalPages: 1,
      totalElements: 0,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: true,
    } as never);

    renderPagina();

    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
  });
});
