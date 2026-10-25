import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CobrosDeHoy from '../pages/CobrosDeHoy';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import type { CobrosHoyResponse } from '@/shared/types/business';

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
    getFeePayments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    getCobrosHoy: vi.fn(),
    getCuotas: vi.fn(),
  },
}));

const cobroVencido: CobrosHoyResponse = {
  fecha: '2026-08-25',
  hoy: { cantidad: 1, monto: { ARS: 15000 } },
  vencidas: { cantidad: 1, monto: { ARS: 20000 } },
  items: [
    {
      id: 10,
      saleId: 2,
      clientId: 3,
      clientName: 'Maria Lopez',
      clientPhone: '0981-555-123',
      saleDescription: 'Televisor 32 pulgadas',
      saleKind: 'VENTA',
      numeroCuota: 1,
      totalCuotas: 12,
      monto: 15000,
      fechaVencimiento: '2026-08-25',
      pagada: false,
      diasAtraso: 0,
      estado: 'TODAY',
    },
    {
      id: 11,
      saleId: 5,
      clientId: 4,
      clientName: 'Juan Perez',
      saleDescription: null,
      saleKind: 'PRESTAMO',
      numeroCuota: 2,
      totalCuotas: 6,
      monto: 20000,
      fechaVencimiento: '2026-08-20',
      pagada: false,
      diasAtraso: 5,
      estado: 'DELAYED',
    },
  ],
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <CobrosDeHoy user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('CobrosDeHoy', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.getCobrosHoy).mockReset();
  });

  it('muestra el resumen del día y la agenda de cobros', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    // Chips con montos y cantidades
    expect(screen.getByText('Vencen hoy')).toBeInTheDocument();
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getAllByText('$ 15.000').length).toBeGreaterThan(0);
    expect(screen.getByText('Vencida · 5 días')).toBeInTheDocument();
    // Botones de cobro
    expect(screen.getAllByRole('button', { name: /Cobrar/ }).length).toBe(2);
  });

  it('muestra el estado vacío cuando no hay cobros pendientes', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 0, monto: {} },
      vencidas: { cantidad: 0, monto: {} },
      items: [],
    });

    renderPagina();

    expect(await screen.findByText('No hay cuotas por cobrar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cobrar/ })).not.toBeInTheDocument();
  });

  it('muestra el total del plan en una cuota acordada', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('li')!;
    expect(fila).toHaveTextContent('Cuota 1 de 12');
  });

  it('oculta el total del plan en una cuota extra generada por un pago parcial', async () => {
    // Los pagos parciales reparten la deuda en más cuotas que las acordadas: la 7
    // existe, pero el "de 6" ya no la describe
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 15000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], numeroCuota: 7, totalCuotas: 6 }],
    });

    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('li')!;
    expect(fila).toHaveTextContent('Cuota 7');
    expect(fila).not.toHaveTextContent('de 6');
  });

  it('muestra el error del backend', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockRejectedValue(new Error('sin conexión'));

    renderPagina();

    expect(await screen.findByText('sin conexión')).toBeInTheDocument();
  });

  it('muestra el monto cobrable cuando la deuda de la venta es menor que la cuota', async () => {
    // Cuota de 25.000 en una venta que sólo debe 10.000: la fila no puede
    // prometer más de lo que se puede cobrar
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 10000 }],
    });

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('$ 10.000')).toBeInTheDocument();
    expect(screen.queryByText('$ 25.000')).not.toBeInTheDocument();
  });

  it('precarga el cobro con el monto cobrable de la cuota', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 10000 }],
    });

    renderPagina();

    await user.click(await screen.findByRole('button', { name: /Cobrar/ }));

    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(10000);
  });

  it('precarga el cobro con el monto de la cuota cuando la deuda es mayor', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 60000 }],
    });

    renderPagina();

    await user.click(await screen.findByRole('button', { name: /Cobrar/ }));

    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(25000);
  });
});
