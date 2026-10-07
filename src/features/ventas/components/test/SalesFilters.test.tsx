import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesFilters from '../SalesFilters';

const baseProps = {
  searchTerm: '',
  onSearchChange: vi.fn(),
  year: '2026',
  setYear: vi.fn(),
  month: '08',
  setMonth: vi.fn(),
  specificDate: '',
  setSpecificDate: vi.fn(),
};

const renderFilters = (props: Record<string, unknown> = {}) =>
  render(<SalesFilters {...baseProps} {...props} />);

describe('SalesFilters', () => {
  it('el preset Hoy fija la fecha de hoy y limpia año/mes', async () => {
    const setSpecificDate = vi.fn();
    const setYear = vi.fn();
    const setMonth = vi.fn();
    const user = userEvent.setup();
    renderFilters({ setSpecificDate, setYear, setMonth });

    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(now.getDate()).padStart(2, '0')}`;
    expect(setSpecificDate).toHaveBeenCalledWith(today);
    expect(setYear).toHaveBeenCalledWith('');
    expect(setMonth).toHaveBeenCalledWith('');
  });

  it('llama onSearchChange al escribir en la búsqueda por descripción', async () => {
    const onSearchChange = vi.fn();
    renderFilters({ onSearchChange });

    fireEvent.input(screen.getByPlaceholderText(/descripcion producto/i), {
      target: { value: 'TV' },
    });

    await waitFor(() => expect(onSearchChange).toHaveBeenCalledWith('TV'), {
      timeout: 2000,
    });
  });

  it('oculta la búsqueda por descripción cuando isLoan es true', () => {
    renderFilters({ isLoan: true, onClientNameChange: vi.fn() });

    expect(
      screen.queryByPlaceholderText(/descripcion producto/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/nombre cliente/i),
    ).toBeInTheDocument();
  });

  it('el botón Limpiar filtros llama onClearFilters', async () => {
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    renderFilters({ onClearFilters });

    await user.click(screen.getByRole('button', { name: /Limpiar filtros/i }));

    expect(onClearFilters).toHaveBeenCalled();
  });
});
