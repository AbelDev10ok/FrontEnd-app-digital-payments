import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Preferencia explícita del usuario, o `null` cuando el tema sigue al sistema. */
export function readStoredTheme(): Theme | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  // Chrome del navegador (PWA/móvil) acorde al tema.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1613' : '#1a8059');
}

interface ThemeState {
  /** Tema efectivo (el que se está aplicando). */
  theme: Theme;
  /** Aplica y persiste un tema explícito. */
  setTheme: (theme: Theme) => void;
  /** Alterna entre claro y oscuro y persiste la elección. */
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Almacenamiento no disponible: el tema se aplica igual.
    }
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
  },
}));

/** Estado y acciones de tema para componentes de UI. */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return { theme, isDark: theme === 'dark', setTheme, toggleTheme };
}

let currentMq: MediaQueryList | null = null;
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

/**
 * Hidrata el tema antes del primer render: aplica la preferencia guardada o la
 * del sistema y, mientras no haya preferencia explícita, sigue los cambios de
 * `prefers-color-scheme` en vivo. Se llama una vez desde `main.tsx`; el script
 * inline de `index.html` ya aplicó el tema antes del primer pintado para
 * evitar el flash de tema incorrecto.
 */
export function initTheme(): void {
  const theme = readStoredTheme() ?? systemTheme();
  applyTheme(theme);
  useThemeStore.setState({ theme });

  if (currentMq && systemListener) currentMq.removeEventListener('change', systemListener);
  currentMq = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  systemListener = (e: MediaQueryListEvent) => {
    if (readStoredTheme() !== null) return;
    const next: Theme = e.matches ? 'dark' : 'light';
    applyTheme(next);
    useThemeStore.setState({ theme: next });
  };
  currentMq?.addEventListener('change', systemListener);
}
