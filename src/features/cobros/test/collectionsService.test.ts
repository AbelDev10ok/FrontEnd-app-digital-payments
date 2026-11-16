import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectionsService } from '../services/collectionsService';
import { authenticatedFetch } from '@/features/auth/services/authServices';
import { LOANS_API_URL } from '@/shared/config/api';

vi.mock('@/features/auth/services/authServices', () => ({
  authenticatedFetch: vi.fn(),
}));

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const agendaVacia = {
  fecha: '2026-08-20',
  hoy: { cantidad: 0, monto: {} },
  vencidas: { cantidad: 0, monto: {} },
  items: [],
};

describe('collectionsService.getCobrosHoy', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('arma la URL con la fecha y el vendedor de la cartera', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse(agendaVacia));

    await collectionsService.getCobrosHoy({ fecha: '2026-08-20', sellerId: 5 });

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toContain(`${LOANS_API_URL}/collections/today?`);
    expect(url).toContain('date=2026-08-20');
    expect(url).toContain('sellerId=5');
  });

  it('sin filtros pide la agenda de hoy sin query string', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(okResponse(agendaVacia));

    await collectionsService.getCobrosHoy();

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toBe(`${LOANS_API_URL}/collections/today`);
  });
});

describe('collectionsService.marcarRecordatorio', () => {
  beforeEach(() => {
    vi.mocked(authenticatedFetch).mockReset();
  });

  it('registra el recordatorio de la cuota y desenvuelve el envelope', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      okResponse({
        message: 'Recordatorio registrado',
        status: 'OK',
        data: { feeId: 10, ultimoRecordatorio: '2026-08-25T14:30:00', recordatorios: 2 },
      }),
    );

    const marca = await collectionsService.marcarRecordatorio(10);

    expect(authenticatedFetch).toHaveBeenCalledWith(`${LOANS_API_URL}/fee/10/reminder`, {
      method: 'POST',
    });
    expect(marca.recordatorios).toBe(2);
    expect(marca.ultimoRecordatorio).toBe('2026-08-25T14:30:00');
  });

  it('propaga el mensaje del backend cuando rechaza el registro', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue(
      new Response(
        JSON.stringify({ message: 'La cuota ya está cobrada', status: 'BAD_REQUEST', data: null }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(collectionsService.marcarRecordatorio(10)).rejects.toThrow(
      'La cuota ya está cobrada',
    );
  });
});
