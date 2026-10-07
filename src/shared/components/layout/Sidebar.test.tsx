import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

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

  it('expande el submenú de préstamos con Nuevo Préstamo y filtros', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Préstamos/i }));
    expect(screen.getAllByText('Nuevo Préstamo').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: /Todas/i })).toBeInTheDocument();
  });

  it('expande el submenú de clientes', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Clientes/i }));
    expect(screen.getByText('Ver Clientes')).toBeInTheDocument();
    expect(screen.getByText('Crear Cliente')).toBeInTheDocument();
  });

  it('expande el submenú de ventas con Nueva Venta y filtros de estado', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard');
    await user.click(screen.getByRole('button', { name: /Ventas/i }));
    expect(screen.getAllByText('Nueva Venta').length).toBeGreaterThanOrEqual(2);
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
    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('expande solo préstamos al navegar con kind=PRESTAMO (no abre ventas)', () => {
    renderSidebar('/dashboard/ventas/todas?kind=PRESTAMO&status=ACTIVE');
    expect(screen.getAllByText('Nuevo Préstamo').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Nueva Venta')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Activas/i })).toHaveClass(
      'bg-brand-50',
    );
  });

  it('Nueva Venta abre el menú de ventas y cierra el de préstamos', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard/prestamos/crear');
    await user.click(screen.getByRole('link', { name: 'Nueva Venta' }));
    await waitFor(() =>
      expect(screen.getAllByText('Nueva Venta').length).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getAllByText('Nuevo Préstamo')).toHaveLength(1);
  });

  it('Nuevo Préstamo abre el menú de préstamos y cierra el de ventas', async () => {
    const user = userEvent.setup();
    renderSidebar('/dashboard/ventas/crear');
    await user.click(screen.getByRole('link', { name: 'Nuevo Préstamo' }));
    await waitFor(() =>
      expect(screen.getAllByText('Nuevo Préstamo').length).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getAllByText('Nueva Venta')).toHaveLength(1);
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
});
