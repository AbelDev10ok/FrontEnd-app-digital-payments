import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

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

describe('DashboardLayout', () => {
  it('renderiza children dentro del layout', () => {
    render(
      <MemoryRouter>
        <DashboardLayout title="Dashboard" user={null} onLogout={vi.fn()}>
          <p>Contenido de la página</p>
        </DashboardLayout>
      </MemoryRouter>,
    );
    expect(screen.getByText('Contenido de la página')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });

  it('actualiza document.title según el título de la página', () => {
    render(
      <MemoryRouter>
        <DashboardLayout title="Clientes" user={null} onLogout={vi.fn()}>
          <span />
        </DashboardLayout>
      </MemoryRouter>,
    );
    expect(document.title).toBe('Clientes · Gestión de Cobros y Ventas');
  });

  it('ofrece un salto al contenido antes del menú', () => {
    render(
      <MemoryRouter>
        <DashboardLayout title="Dashboard" user={null} onLogout={vi.fn()}>
          <p>Contenido de la página</p>
        </DashboardLayout>
      </MemoryRouter>,
    );

    const salto = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(salto).toHaveAttribute('href', '#contenido-principal');
    // El destino tiene que existir y poder recibir el foco.
    const principal = document.querySelector('#contenido-principal');
    expect(principal).not.toBeNull();
    expect(principal).toHaveAttribute('tabindex', '-1');
  });
});
