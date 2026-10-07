import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSalesFilters } from '../useSalesFilters';
import { useSalesFilterStore } from '../../store/salesFilterStore';

const currentYear = () => new Date().getFullYear();
const currentMonth = () => new Date().getMonth() + 1;

describe('useSalesFilters', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSalesFilterStore.setState({ year: currentYear(), month: currentMonth() });
  });

  it('expone year y month como strings con cero a la izquierda', () => {
    useSalesFilterStore.setState({ year: 2025, month: 3 });
    const { result } = renderHook(() => useSalesFilters());
    expect(result.current.year).toBe('2025');
    expect(result.current.month).toBe('03');
  });

  it('setYear y setMonth persisten en el store y actualizan el hook', () => {
    const { result } = renderHook(() => useSalesFilters());
    act(() => result.current.setYear('2024'));
    act(() => result.current.setMonth('12'));
    expect(useSalesFilterStore.getState().year).toBe(2024);
    expect(useSalesFilterStore.getState().month).toBe(12);
    expect(result.current.year).toBe('2024');
    expect(result.current.month).toBe('12');
  });

  it('getFinalDate usa la fecha específica cuando existe', () => {
    const { result } = renderHook(() => useSalesFilters());
    act(() => result.current.setSpecificDate('2026-08-15'));
    expect(result.current.date).toBe('2026-08-15');
  });

  it('getFinalDate combina year-month cuando no hay fecha específica', () => {
    useSalesFilterStore.setState({ year: 2025, month: 7 });
    const { result } = renderHook(() => useSalesFilters());
    expect(result.current.date).toBe('2025-07');
  });

  it('tolera year/month null en el store sin romper (regresión Fase 6)', () => {
    useSalesFilterStore.setState({
      year: null as unknown as number,
      month: null as unknown as number,
    });
    const { result } = renderHook(() => useSalesFilters());
    expect(result.current.year).toBe('');
    expect(result.current.month).toBe('');
  });

  it('setYear/setMonth con vacío limpian el filtro de fecha', () => {
    const { result } = renderHook(() => useSalesFilters());
    act(() => result.current.setYear(''));
    act(() => result.current.setMonth(''));
    expect(result.current.year).toBe('');
    expect(result.current.month).toBe('');
  });
});
