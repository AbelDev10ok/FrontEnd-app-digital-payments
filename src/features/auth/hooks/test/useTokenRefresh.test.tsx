import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTokenRefresh } from '../useTokenRefresh';

const { checkTokenExpiration } = vi.hoisted(() => ({ checkTokenExpiration: vi.fn() }));

vi.mock('@features/auth/store/authStore', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    checkTokenExpiration,
  }),
}));

describe('useTokenRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('verifica el token al montar y cada 4 minutos', () => {
    renderHook(() => useTokenRefresh());
    expect(checkTokenExpiration).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000);
    });
    expect(checkTokenExpiration).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000);
    });
    expect(checkTokenExpiration).toHaveBeenCalledTimes(3);
  });

  it('verifica el token al volver a la pestaña visible', () => {
    renderHook(() => useTokenRefresh());
    expect(checkTokenExpiration).toHaveBeenCalledTimes(1);

    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(checkTokenExpiration).toHaveBeenCalledTimes(2);
  });

  it('no verifica el token si la pestaña está oculta', () => {
    renderHook(() => useTokenRefresh());
    expect(checkTokenExpiration).toHaveBeenCalledTimes(1);

    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(checkTokenExpiration).toHaveBeenCalledTimes(1);
  });
});
