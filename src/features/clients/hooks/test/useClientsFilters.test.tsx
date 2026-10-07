import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClientsFilters } from '../useClientsFilters';
import { clientService } from '@features/clients/services/clientServices';
import { Client } from '@/shared/types/client';

vi.mock('@features/clients/services/clientServices', () => ({
  clientService: { getVendedoresActivos: vi.fn() },
}));

const seller = (id: number, name: string): Client =>
  ({ id, name, telefono: '', email: '', direccion: '', seller: true }) as Client;

describe('useClientsFilters', () => {
  beforeEach(() => {
    vi.mocked(clientService.getVendedoresActivos).mockReset();
  });

  it('arranca con opciones Todos y Sin vendedor y filtros por defecto', () => {
    vi.mocked(clientService.getVendedoresActivos).mockResolvedValue([]);
    const { result } = renderHook(() => useClientsFilters());
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedVendedorId).toBeNull();
    expect(result.current.showFilters).toBe(false);
    expect(result.current.vendedoresOptions).toEqual([
      { id: null, name: 'Todos' },
      { id: -1, name: 'Sin vendedor' },
    ]);
  });

  it('agrega vendedores únicos (deduplicados por id) entre Todos y Sin vendedor', async () => {
    vi.mocked(clientService.getVendedoresActivos).mockResolvedValue([
      seller(1, 'Ana'),
      seller(2, 'Luis'),
      seller(1, 'Ana'),
    ]);
    const { result } = renderHook(() => useClientsFilters());

    await waitFor(() => {
      expect(result.current.vendedoresOptions).toEqual([
        { id: null, name: 'Todos' },
        { id: 1, name: 'Ana' },
        { id: 2, name: 'Luis' },
        { id: -1, name: 'Sin vendedor' },
      ]);
    });
  });

  it('los setters actualizan los filtros', async () => {
    vi.mocked(clientService.getVendedoresActivos).mockResolvedValue([]);
    const { result } = renderHook(() => useClientsFilters());

    await act(async () => {
      result.current.setSearchTerm('ana');
      result.current.setSelectedVendedorId(1);
      result.current.setShowFilters(true);
    });

    expect(result.current.searchTerm).toBe('ana');
    expect(result.current.selectedVendedorId).toBe(1);
    expect(result.current.showFilters).toBe(true);
  });
});
