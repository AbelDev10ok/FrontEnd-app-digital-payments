import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Header', () => {
  it('muestra el email y el rol del usuario', () => {
    render(<Header user={{ email: 'a@b.com', role: 'ROLE_USER' }} onLogout={vi.fn()} />);
    expect(screen.getByText('a@b.com')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('no repite el título de la página (vive en el PageHeader)', () => {
    render(<Header user={{ email: 'a@b.com', role: 'ROLE_USER' }} onLogout={vi.fn()} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('llama onLogout al pulsar el botón de cerrar sesión', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<Header user={null} onLogout={onLogout} />);
    await user.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('muestra el botón de menú móvil y dispara onMenuToggle', async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    render(<Header user={null} onLogout={vi.fn()} showMenuButton onMenuToggle={onMenuToggle} />);
    const menuButton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(menuButton).toBeInTheDocument();
    await user.click(menuButton);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('traduce el rol de administrador', () => {
    render(<Header user={{ email: 'x@y.com', role: 'ROLE_ADMIN' }} onLogout={vi.fn()} />);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });
});
