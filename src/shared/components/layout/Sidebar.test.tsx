import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { salesService } from '@/features/ventas/services/salesServices';
import { useSalesCountsStore } from '@/features/ventas/store/salesCountsStore';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getProductTypes: vi.fn().mockResolvedValue([{ id: 1, name: 'TV' }]),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 10,
      active: 3,
      completed: 5,
      canceled: 1,
      aCobrar: 4,
    }),
  },
}));

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

const renderSidebar = (path = '/dashboard', onNavigate?: () => void) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar isOpen onNavigate={onNavigate} />
      <LocationDisplay />
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  it('muestra la marca y las secciones principales', () => {
    renderSidebar();
    expect(screen.getByText('Gestión de Cobros')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Préstamos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva Venta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nuevo Préstamo' })).toBeInTheDocument();
  });

  it('expande el submenú de préstamos con los filtros de estado', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Préstamos/i }));
    // El submenú es solo filtros: "Nuevo Préstamo" vive una vez, en Acciones rápidas
    expect(screen.getAllByText('Nuevo Préstamo')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Todas/i })).toBeInTheDocument();
  });

  it('expande el submenú de clientes', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Clientes/i }));
    expect(screen.getByText('Ver Clientes')).toBeInTheDocument();
    expect(screen.getByText('Crear Cliente')).toBeInTheDocument();
  });

  it('expande el submenú de ventas con los filtros de estado', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Ventas/i }));
    // El submenú es solo filtros: "Nueva Venta" vive una vez, en Acciones rápidas
    expect(screen.getAllByText('Nueva Venta')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Todas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /A Cobrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Completadas/i })).toBeInTheDocument();
  });

  it('navega a Todas sin status al pulsar Todas (fix bug)', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Ventas/i }));
    await user.click(screen.getByRole('button', { name: /Todas/i }));
    expect(screen.getByTestId('location').textContent).toBe(
      '/dashboard/ventas/todas',
    );
  });

  it('navega con status=A_COBRAR desde el filtro de ventas', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Ventas/i }));
    await user.click(screen.getByRole('button', { name: /A Cobrar/i }));
    expect(screen.getByTestId('location').textContent).toBe(
      '/dashboard/ventas/todas?status=A_COBRAR',
    );
  });

  it('los filtros de préstamos preservan kind=PRESTAMO', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Préstamos/i }));
    await user.click(screen.getByRole('button', { name: /Activas/i }));
    expect(screen.getByTestId('location').textContent).toBe(
      '/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE',
    );
  });

  it('muestra badges con conteos en los filtros de estado', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Ventas/i }));
    expect(await screen.findByRole('button', { name: /Todas 10/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /A Cobrar 4/ })).toBeInTheDocument();
  });

  it('expande solo préstamos al navegar con kind=PRESTAMO (no abre ventas)', () => {
    renderSidebar('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE');
    expect(screen.getAllByText('Nuevo Préstamo')).toHaveLength(1);
    // Los submenús colapsados siguen en el DOM (animación de colapso), así que
    // se consulta por rol, que sí respeta lo oculto.
    expect(screen.getAllByRole('link', { name: 'Nueva Venta' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Activas/i })).toHaveClass(
      'bg-brand-50',
    );
  });

  it('Nueva Venta abre el menú de ventas y cierra el de préstamos', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard/prestamos/crear');
    await user.click(screen.getByRole('link', { name: 'Nueva Venta' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ventas/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: /Préstamos/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('Nuevo Préstamo abre el menú de préstamos y cierra el de ventas', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard/ventas/crear');
    await user.click(screen.getByRole('link', { name: 'Nuevo Préstamo' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Préstamos/i })).toHaveAttribute(
        'aria-expanded',
        'true',
      ),
    );
    expect(screen.getByRole('button', { name: /Ventas/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('llama onNavigate al navegar', async () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <Sidebar isOpen onNavigate={onNavigate} />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(onNavigate).toHaveBeenCalled();
  });

  it('vuelve a pedir los conteos cuando una operación los marca viejos', async () => {
    vi.mocked(salesService.getSalesCounts).mockClear();
    renderSidebar();
    await waitFor(() => expect(salesService.getSalesCounts).toHaveBeenCalledTimes(2));

    // Anular o eliminar una venta avisa por el store: sin recargar, el menú
    // vuelve a pedir los conteos de ventas y préstamos.
    act(() => {
      useSalesCountsStore.getState().refresh();
    });

    await waitFor(() => expect(salesService.getSalesCounts).toHaveBeenCalledTimes(4));
  });
});
