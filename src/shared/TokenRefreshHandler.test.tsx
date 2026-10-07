import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import TokenRefreshHandler from './TokenRefreshHandler';

const { navigate, locationRef, subscribeMock } = vi.hoisted(() => ({
  navigate: vi.fn(),
  locationRef: { pathname: '/dashboard' },
  subscribeMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => locationRef,
}));

vi.mock('@features/auth/hooks/useTokenRefresh', () => ({
  useTokenRefresh: vi.fn(),
}));

vi.mock('@features/auth/store/authStore', () => ({
  useAuthStore: { subscribe: subscribeMock },
}));

type AuthListener = (state: { isAuthenticated: boolean }) => void;

describe('TokenRefreshHandler', () => {
  let subscriber: AuthListener | null = null;

  beforeEach(() => {
    subscriber = null;
    navigate.mockClear();
    subscribeMock.mockClear();
    locationRef.pathname = '/dashboard';
    subscribeMock.mockImplementation((listener: AuthListener) => {
      subscriber = listener;
      return () => {};
    });
  });

  it('no redirige cuando el estado sigue autenticado', () => {
    render(<TokenRefreshHandler />);
    subscriber?.({ isAuthenticated: true });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirige a /login cuando se pierde la autenticación', () => {
    render(<TokenRefreshHandler />);
    subscriber?.({ isAuthenticated: false });
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('no redirige si ya estamos en /login', () => {
    locationRef.pathname = '/login';
    render(<TokenRefreshHandler />);
    subscriber?.({ isAuthenticated: false });
    expect(navigate).not.toHaveBeenCalled();
  });
});
