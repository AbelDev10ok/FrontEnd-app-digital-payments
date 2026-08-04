import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '@/features/auth/store/authStore';

const TestChild = ({ user, onLogout }: { user?: { email?: string } | null; onLogout?: () => void }) => (
  <div>
    <span>{user?.email ?? 'sin-user'}</span>
    <button onClick={onLogout}>cerrar-sesion</button>
  </div>
);

const TestComponent = ({ user }: { user?: { email?: string } | null }) => (
  <div>componente {user?.email}</div>
);

const renderProtected = (element: ReactNode) =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>PaginaLogin</div>} />
        <Route path="/dashboard" element={<div>DashboardPagina</div>} />
        <Route path="/admin" element={<div>AdminPagina</div>} />
        <Route path="/protected" element={element} />
      </Routes>
    </MemoryRouter>,
  );

const resetStore = () => {
  localStorage.clear();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
  });
};

describe('ProtectedRoute', () => {
  beforeEach(resetStore);

  it('redirige a /login si no hay sesión', () => {
    renderProtected(
      <ProtectedRoute requiredRole="ROLE_USER">
        <TestChild />
      </ProtectedRoute>,
    );
    expect(screen.getByText('PaginaLogin')).toBeInTheDocument();
  });

  it('redirige a /dashboard si ROLE_USER intenta entrar al área admin', () => {
    useAuthStore.setState({ user: { email: 'u@x.com', role: 'ROLE_USER' }, isAuthenticated: true });
    renderProtected(
      <ProtectedRoute requiredRole="ROLE_ADMIN">
        <TestChild />
      </ProtectedRoute>,
    );
    expect(screen.getByText('DashboardPagina')).toBeInTheDocument();
  });

  it('redirige a /admin si ROLE_ADMIN intenta entrar al área de usuario', () => {
    useAuthStore.setState({ user: { email: 'a@x.com', role: 'ROLE_ADMIN' }, isAuthenticated: true });
    renderProtected(
      <ProtectedRoute requiredRole="ROLE_USER">
        <TestChild />
      </ProtectedRoute>,
    );
    expect(screen.getByText('AdminPagina')).toBeInTheDocument();
  });

  it('inyecta user y onLogout al hijo válido', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({
      user: { email: 'u@x.com', role: 'ROLE_USER' },
      accessToken: 't',
      refreshToken: 'r',
      isAuthenticated: true,
    });
    renderProtected(
      <ProtectedRoute requiredRole="ROLE_USER">
        <TestChild />
      </ProtectedRoute>,
    );

    expect(screen.getByText('u@x.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'cerrar-sesion' }));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('renderiza el componente con user inyectado', () => {
    useAuthStore.setState({ user: { email: 'c@x.com', role: 'ROLE_USER' }, isAuthenticated: true });
    renderProtected(<ProtectedRoute requiredRole="ROLE_USER" component={TestComponent} />);
    expect(screen.getByText('componente c@x.com')).toBeInTheDocument();
  });
});
