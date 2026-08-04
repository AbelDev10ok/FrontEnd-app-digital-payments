import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { useAuthStore } from '@/features/auth/store/authStore';

const encodePayload = (obj: object) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Token largo (no expira pronto) para que TokenRefreshHandler no refresque durante el test.
const longToken = `${encodePayload({ alg: 'HS256' })}.${encodePayload({
  sub: 'user@x.com',
  authorities: '[ROLE_USER]',
  exp: Math.floor(Date.now() / 1000) + 7200,
})}.firma`;

const setAuthedUser = () => {
  useAuthStore.setState({
    user: { email: 'user@x.com', role: 'ROLE_USER' },
    accessToken: longToken,
    refreshToken: 'rt',
    isAuthenticated: true,
    isLoading: false,
  });
};

describe('rutas de App', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    window.history.pushState({}, '', '/');
  });

  it('/dashboard/ventas/crear no es capturada por la ruta dinámica :id', async () => {
    setAuthedUser();
    window.history.pushState({}, '', '/dashboard/ventas/crear');
    render(<App />);
    const titulos = await screen.findAllByText('Nueva Transacción');
    expect(titulos.length).toBeGreaterThan(0);
  });

  it('/dashboard/ventas/todas no es capturada por la ruta dinámica :id', async () => {
    setAuthedUser();
    window.history.pushState({}, '', '/dashboard/ventas/todas');
    render(<App />);
    const titulos = await screen.findAllByText('Todas las Ventas');
    expect(titulos.length).toBeGreaterThan(0);
  });

  it('redirige a /login si no hay sesión', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('Iniciar Sesión')).toBeInTheDocument();
  });
});
