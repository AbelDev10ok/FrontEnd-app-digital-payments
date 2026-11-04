import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTheme, initTheme } from '../useTheme';

type MediaListener = (e: { matches: boolean }) => void;

function stubMatchMedia(initialDark: boolean) {
  const listeners = new Set<MediaListener>();
  const mq = {
    matches: initialDark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, cb: MediaListener) => listeners.add(cb),
    removeEventListener: (_type: string, cb: MediaListener) => listeners.delete(cb),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => mq));
  return {
    setSystemDark(dark: boolean) {
      mq.matches = dark;
      listeners.forEach((cb) => cb({ matches: dark }));
    },
  };
}

const isDarkApplied = () => document.documentElement.classList.contains('dark');

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('aplica el tema del sistema cuando no hay preferencia guardada', () => {
    stubMatchMedia(true);
    act(() => initTheme());
    expect(isDarkApplied()).toBe(true);
  });

  it('la preferencia guardada manda sobre el sistema', () => {
    localStorage.setItem('theme', 'light');
    stubMatchMedia(true);
    act(() => initTheme());
    expect(isDarkApplied()).toBe(false);
  });

  it('toggleTheme alterna el tema y lo persiste en localStorage', () => {
    stubMatchMedia(false);
    act(() => initTheme());
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(isDarkApplied()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(result.current.isDark).toBe(true);
    act(() => result.current.toggleTheme());
    expect(isDarkApplied()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('setTheme aplica un tema explícito sin alternar', () => {
    stubMatchMedia(false);
    act(() => initTheme());
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('dark'));
    expect(isDarkApplied()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('sigue al sistema en vivo mientras no haya preferencia guardada', () => {
    const system = stubMatchMedia(false);
    act(() => initTheme());
    const { result } = renderHook(() => useTheme());
    act(() => system.setSystemDark(true));
    expect(isDarkApplied()).toBe(true);
    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('ignora cambios del sistema cuando el usuario ya eligió', () => {
    const system = stubMatchMedia(false);
    act(() => initTheme());
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme('light'));
    act(() => system.setSystemDark(true));
    expect(isDarkApplied()).toBe(false);
    expect(result.current.isDark).toBe(false);
  });

  it('la clase dark refleja el estado expuesto por el hook', () => {
    stubMatchMedia(false);
    act(() => initTheme());
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(isDarkApplied()).toBe(true);
  });
});
