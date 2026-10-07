import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientService } from '../clientServices';
import { authenticatedFetch } from '@/features/auth/services/authServices';
import { CLIENTS_API_URL } from '@/shared/config/api';

vi.mock('@/features/auth/services/authServices', () => ({
  authenticatedFetch: vi.fn(),
}));

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('clientService', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('getClientsPaginated construye la URL con todos los filtros', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse({ content: [], totalPages: 0 }));

    await clientService.getClientsPaginated({
      page: 1,
      size: 20,
      search: 'Ana',
      sellerId: 5,
      withoutSeller: true,
    });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toContain(`${CLIENTS_API_URL}?`);
    ['page=1', 'size=20', 'search=Ana', 'sellerId=5', 'withoutSeller=true'].forEach((p) =>
      expect(url).toContain(p),
    );
  });

  it('getClientsPaginated omite los filtros opcionales no provistos', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse({ content: [], totalPages: 0 }));

    await clientService.getClientsPaginated({ page: 0, size: 10 });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${CLIENTS_API_URL}?page=0&size=10`);
  });

  it('getClientById llama al endpoint correcto', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse({ id: 7 }));

    await expect(clientService.getClientById(7)).resolves.toEqual({ id: 7 });
    expect(vi.mocked(authenticatedFetch).mock.calls[0][0]).toBe(`${CLIENTS_API_URL}/7`);
  });

  it('getClientById lanza el error extraído del body si falla', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'No encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(clientService.getClientById(7)).rejects.toThrow('No encontrado');
  });

  it('createClient hace POST con el body serializado', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse({ id: 1, name: 'Ana' }));
    const data = { name: 'Ana', telefono: '', email: '', direccion: '' };

    await clientService.createClient(data);

    const [url, opts] = vi.mocked(authenticatedFetch).mock.calls[0];
    expect(url).toBe(CLIENTS_API_URL);
    expect(opts?.method).toBe('POST');
    expect(JSON.parse(opts?.body as string)).toEqual(data);
  });

  it('getVendedoresConClientesAsignados llama a /vendedores', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse([]));

    await clientService.getVendedoresConClientesAsignados();

    expect(vi.mocked(authenticatedFetch).mock.calls[0][0]).toBe(`${CLIENTS_API_URL}/vendedores`);
  });
});
