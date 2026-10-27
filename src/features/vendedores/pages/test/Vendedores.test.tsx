import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Vendedores from '../Vendedores';
import type { SellerMetricsDto } from '@/shared/types/sellers';

vi.mock('@/shared/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/features/vendedores/services/sellerServices', () => ({
  sellerService: { getSellerMetrics: vi.fn() },
}));

import { sellerService } from '@/features/vendedores/services/sellerServices';

const metricas: SellerMetricsDto = {
  year: 2026,
  month: 10,
  monedasDisponibles: ['ARS'],
  vendedores: [
    {
      sellerId: 2,
      sellerName: 'ana',
      activo: true,
      clientesCartera: 3,
      operaciones: { VENTA: 4, PRESTAMO: 1 },
      anuladas: { VENTA: 1, PRESTAMO: 0 },
      vendido: { VENTA: { ARS: 1000 }, PRESTAMO: { ARS: 500 } },
      cobrado: { VENTA: { ARS: 300 }, PRESTAMO: {} },
      deuda: { VENTA: { ARS: 700 }, PRESTAMO: {} },
    },
    {
      sellerId: 4,
      sellerName: 'luis',
      activo: false,
      clientesCartera: 0,
      operaciones: { VENTA: 0, PRESTAMO: 0 },
      anuladas: { VENTA: 0, PRESTAMO: 0 },
      vendido: { VENTA: {}, PRESTAMO: {} },
      cobrado: { VENTA: {}, PRESTAMO: {} },
      deuda: { VENTA: {}, PRESTAMO: {} },
    },
  ],
  sinVendedor: {
    sellerId: null,
    sellerName: 'Sin vendedor',
    activo: false,
    clientesCartera: 5,
    operaciones: { VENTA: 1, PRESTAMO: 0 },
    anuladas: { VENTA: 0, PRESTAMO: 0 },
    vendido: { VENTA: { ARS: 200 }, PRESTAMO: {} },
    cobrado: { VENTA: {}, PRESTAMO: {} },
    deuda: { VENTA: { ARS: 50 }, PRESTAMO: {} },
  },
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Vendedores user={{ email: 'dueno@example.com', role: 'ROLE_USER' }} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('Vendedores', () => {
  it('muestra las filas por vendedor, los deshabilitados y la fila Sin vendedor', async () => {
    vi.mocked(sellerService.getSellerMetrics).mockResolvedValue(metricas);

    renderPagina();

    await screen.findByText('ana');
    expect(screen.getByText('luis')).toBeInTheDocument();
    expect(screen.getByText('Deshabilitado')).toBeInTheDocument();
    expect(screen.getByText('Sin vendedor')).toBeInTheDocument();
    expect(sellerService.getSellerMetrics).toHaveBeenCalledWith(2026, 10);
  });

  it('separa ventas y préstamos con el conmutador', async () => {
    vi.mocked(sellerService.getSellerMetrics).mockResolvedValue(metricas);
    const user = userEvent.setup();

    renderPagina();
    const filaAna = (await screen.findByText('ana')).closest('tr') as HTMLTableRowElement;

    // Ventas: 4 operaciones, 1 anulada
    expect(within(filaAna).getByText('4')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Préstamos' }));

    // Préstamos: 1 operación, 0 anuladas
    expect(within(filaAna).getByText('1')).toBeInTheDocument();
    expect(within(filaAna).getByText('0')).toBeInTheDocument();
  });

  it('enlaza a las operaciones y a los clientes del vendedor (y de los sin vendedor)', async () => {
    vi.mocked(sellerService.getSellerMetrics).mockResolvedValue(metricas);

    renderPagina();
    const filaAna = (await screen.findByText('ana')).closest('tr') as HTMLTableRowElement;
    const filaSin = screen.getByText('Sin vendedor').closest('tr') as HTMLTableRowElement;

    expect(within(filaAna).getByRole('link', { name: 'Operaciones' })).toHaveAttribute(
      'href',
      '/dashboard/ventas/todas?kind=VENTA&sellerId=2',
    );
    expect(within(filaAna).getByRole('link', { name: 'Clientes' })).toHaveAttribute(
      'href',
      '/dashboard/clientes?vendedor=2',
    );
    expect(within(filaSin).getByRole('link', { name: 'Operaciones' })).toHaveAttribute(
      'href',
      '/dashboard/ventas/todas?kind=VENTA&withoutSeller=true',
    );
    expect(within(filaSin).getByRole('link', { name: 'Clientes' })).toHaveAttribute(
      'href',
      '/dashboard/clientes?sinVendedor=true',
    );
  });

  it('muestra el error si las métricas no se pueden cargar', async () => {
    vi.mocked(sellerService.getSellerMetrics).mockRejectedValue(new Error('Se cortó la conexión'));

    renderPagina();

    await waitFor(() => expect(screen.getByText('Se cortó la conexión')).toBeInTheDocument());
  });
});
