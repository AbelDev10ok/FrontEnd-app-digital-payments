import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import usePaginatedClients from '../usePaginatedClients';
import { Page } from '@features/clients/services/clientServices';
import { Client } from '@/shared/types/client';

const client = (id: number): Client =>
  ({ id, name: `Cliente ${id}`, seller: false }) as unknown as Client;

const page = (content: Client[], totalPages: number) =>
  ({ content, totalPages, totalElements: content.length }) as unknown as Page<Client>;

describe('usePaginatedClients', () => {
  it('carga los datos y expone clients, totalPages y loading', async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([client(1), client(2)], 4));
    const { result } = renderHook(() => usePaginatedClients(fetchFn));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.clients).toHaveLength(2);
    expect(result.current.totalPages).toBe(4);
    expect(fetchFn).toHaveBeenCalledWith({ page: 0, size: 10 });
  });

  it('expone el error si el fetch falla', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Red caída'));
    const { result } = renderHook(() => usePaginatedClients(fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Red caída');
    expect(result.current.clients).toHaveLength(0);
  });

  it('setPage vuelve a llamar al fetch con la nueva página', async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([client(1)], 2));
    const { result } = renderHook(() => usePaginatedClients(fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(1));
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(fetchFn).toHaveBeenCalledWith({ page: 1, size: 10 });
  });

  it('refresh vuelve a llamar al fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue(page([client(1)], 2));
    const { result } = renderHook(() => usePaginatedClients(fetchFn));
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(1));

    act(() => result.current.refresh());
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
  });
});
