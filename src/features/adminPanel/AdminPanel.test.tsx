import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPanel from './AdminPanel';

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

const renderPanel = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AdminPanel', () => {
  it('renderiza el título y los stat cards', async () => {
    renderPanel(<AdminPanel user={{ email: 'admin@test.com', role: 'ROLE_ADMIN' }} onLogout={vi.fn()} />);
    expect(screen.getAllByText('Panel de Administración').length).toBeGreaterThan(0);
    expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Configuraciones')).toBeInTheDocument();
    expect(screen.getByText('Base de Datos')).toBeInTheDocument();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
  });

  it('muestra las secciones de gestión', async () => {
    renderPanel(<AdminPanel user={null} onLogout={vi.fn()} />);
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Configuración del Sistema')).toBeInTheDocument();
    expect(screen.getByText('Acciones Recientes de Admin')).toBeInTheDocument();
  });
});