import { describe, expect, it, vi } from 'vitest';
import { sellerService } from '../sellerServices';
import { authenticatedFetch } from '@/features/auth/services/authServices';

vi.mock('@/features/auth/services/authServices', () => ({
  authenticatedFetch: vi.fn(),
}));

describe('sellerService', () => {
  it('getSellerMetrics pide /api/sellers/metrics con año y mes', async () => {
    vi.mocked(authenticatedFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'ok',
        status: 'OK',
        data: {
          year: 2026,
          month: 10,
          monedasDisponibles: ['ARS'],
          vendedores: [],
          sinVendedor: null,
        },
      }),
    } as never);

    const result = await sellerService.getSellerMetrics(2026, 10);

    const url = vi.mocked(authenticatedFetch).mock.calls[0][0] as string;
    expect(url).toContain('/api/sellers/metrics');
    expect(url).toContain('year=2026');
    expect(url).toContain('month=10');
    expect(result.year).toBe(2026);
    expect(result.monedasDisponibles).toEqual(['ARS']);
  });
});
