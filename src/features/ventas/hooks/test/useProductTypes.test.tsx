import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useProductTypes from '../useProductTypes';
import { salesService } from '@/features/ventas/services/salesServices';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: { getProductTypes: vi.fn() },
}));

describe('useProductTypes', () => {
  beforeEach(() => {
    vi.mocked(salesService.getProductTypes).mockReset();
  });

  it('carga los tipos de producto y apaga loading', async () => {
    const types = [
      { id: 1, name: 'PRESTAMO' },
      { id: 2, name: 'VENTA' },
    ];
    vi.mocked(salesService.getProductTypes).mockResolvedValue(types);
    const { result } = renderHook(() => useProductTypes());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.productTypes).toEqual(types);
    expect(result.current.error).toBeNull();
  });

  it('setea el error si la petición falla', async () => {
    vi.mocked(salesService.getProductTypes).mockRejectedValue(new Error('Red caída'));
    const { result } = renderHook(() => useProductTypes());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Red caída');
    expect(result.current.productTypes).toEqual([]);
  });
});
