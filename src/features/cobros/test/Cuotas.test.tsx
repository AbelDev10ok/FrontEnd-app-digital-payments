import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

  it('muestra el total del plan en una cuota acordada', async () => {
    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('tr')!;
    expect(within(fila).getByText('1 / 12')).toBeInTheDocument();
  });

  it('oculta el total del plan en una cuota extra generada por un pago parcial', async () => {
    // Los pagos parciales reparten la deuda en más cuotas que las acordadas: la 7
    // existe, pero el "/ 6" ya no la describe
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [{ ...cuota, numeroCuota: 7, totalCuotas: 6 }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    } as never);

    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('tr')!;
    expect(within(fila).getByText('7')).toBeInTheDocument();
    expect(within(fila).queryByText(/\/ 6/)).not.toBeInTheDocument();
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

  it('muestra el monto de la cuota y ofrece cobrarla', async () => {
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [{ ...cuota }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    } as never);

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    // El monto que se muestra es el de la cuota
    expect(screen.getByText('$ 15.000')).toBeInTheDocument();
    // Una cuota impaga ofrece el cobro desde el listado
    expect(screen.getByRole('button', { name: /Cobrar/ })).toBeInTheDocument();
  });

  it('acota el monto de una cuota impaga a la deuda de la venta', async () => {
    // Cuota de 25.000 en una venta que sólo debe 10.000: se muestra lo cobrable
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [{ ...cuota, monto: 25000, deudaVenta: 10000 }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    } as never);

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('$ 10.000')).toBeInTheDocument();
    expect(screen.queryByText('$ 25.000')).not.toBeInTheDocument();
  });

  it('en una cuota ya cobrada muestra su monto y no la deuda que queda', async () => {
    vi.mocked(collectionsService.getCuotas).mockResolvedValue({
      content: [{ ...cuota, monto: 25000, deudaVenta: 5000, pagada: true, estado: 'PAID' }],
      totalPages: 1,
      totalElements: 1,
      number: 0,
      size: 20,
      first: true,
      last: true,
      empty: false,
    } as never);

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('$ 25.000')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cobrar/ })).not.toBeInTheDocument();
  });
});
