import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClients } from '../useClients';
import { clientService } from '@features/clients/services/clientServices';
import { Client, ClientRequest } from '@/shared/types/client';

vi.mock('@features/clients/services/clientServices', () => ({
  clientService: { createClient: vi.fn(), updateClient: vi.fn() },
}));

const client = (id: number, name = `Cliente ${id}`): Client =>
  ({ id, name, telefono: '', email: '', direccion: '', seller: false }) as Client;

const request = (): ClientRequest => ({ name: 'Nuevo', telefono: '', email: '', direccion: '' });

describe('useClients', () => {
  beforeEach(() => {
    vi.mocked(clientService.createClient).mockReset();
    vi.mocked(clientService.updateClient).mockReset();
  });

  it('inicializa sin clientes y sin error', () => {
    const { result } = renderHook(() => useClients());
    expect(result.current.clients).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('createClient agrega el cliente a la lista y lo devuelve', async () => {
    const nuevo = client(3);
    vi.mocked(clientService.createClient).mockResolvedValue(nuevo);
    const { result } = renderHook(() => useClients());

    await act(async () => {
      await expect(result.current.createClient(request())).resolves.toEqual(nuevo);
    });

    expect(result.current.clients).toEqual([nuevo]);
    expect(result.current.error).toBeNull();
  });

  it('updateClient reemplaza el cliente con el mismo id', async () => {
    const original = client(1, 'Antes');
    const actualizado = client(1, 'Después');
    vi.mocked(clientService.createClient).mockResolvedValue(original);
    vi.mocked(clientService.updateClient).mockResolvedValue(actualizado);
    const { result } = renderHook(() => useClients());

    await act(async () => {
      await result.current.createClient(original);
    });

    await act(async () => {
      await expect(result.current.updateClient(1, request())).resolves.toEqual(actualizado);
    });

    expect(result.current.clients).toEqual([actualizado]);
  });

  it('createClient setea el error y re-lanza si falla', async () => {
    vi.mocked(clientService.createClient).mockRejectedValue(new Error('Red caída'));
    const { result } = renderHook(() => useClients());

    await act(async () => {
      await expect(result.current.createClient(request())).rejects.toThrow('Red caída');
    });

    expect(result.current.error).toBe('Red caída');
    expect(result.current.clients).toEqual([]);
  });
});
