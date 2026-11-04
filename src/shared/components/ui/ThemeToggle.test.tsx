import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { initTheme } from '@hooks/useTheme';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    act(() => initTheme());
  });

  it('alterna el tema al hacer clic y actualiza su etiqueta accesible', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Cambiar a modo oscuro' });
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });
});
