import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header', () => {
  it('muestra el título y el email del usuario', () => {
    render(<Header title="Dashboard" user={{ email: 'a@b.com', role: 'ROLE_USER' }} onLogout={vi.fn()} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
  });

  it('llama onLogout al pulsar el botón de cerrar sesión', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<Header title="Dashboard" user={null} onLogout={onLogout} />);
    await user.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('muestra el botón de menú móvil y dispara onMenuToggle', async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    render(<Header title="T" user={null} onLogout={vi.fn()} showMenuButton onMenuToggle={onMenuToggle} />);
    const menuButton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(menuButton).toBeInTheDocument();
    await user.click(menuButton);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('traduce el rol de administrador', () => {
    render(<Header title="Admin" user={{ email: 'x@y.com', role: 'ROLE_ADMIN' }} onLogout={vi.fn()} />);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });
});
