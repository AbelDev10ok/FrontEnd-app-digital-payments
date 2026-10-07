import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BusinessMe } from '@/shared/types/business';

vi.mock('@/features/negocio/services/businessService', () => ({
  businessService: {
    getMyBusiness: vi.fn(),
  },
}));

const biz = (currency: string) =>
  ({ id: 1, name: 'Test', currency } as unknown as BusinessMe);

describe('initCurrency / getCurrencySymbol', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('initCurrency carga la moneda del negocio y el símbolo se refleja', async () => {
    const { businessService } = await import('@/features/negocio/services/businessService');
    vi.mocked(businessService.getMyBusiness).mockResolvedValue(biz('USD'));

    const mod = await import('@/shared/utils/formatCurrency');
    await mod.initCurrency();
    expect(mod.getCurrency()).toBe('USD');
    expect(mod.getCurrencySymbol()).toBe('US$');
  });

  it('falla silenciosamente y mantiene ARS si el negocio no responde', async () => {
    const { businessService } = await import('@/features/negocio/services/businessService');
    vi.mocked(businessService.getMyBusiness).mockRejectedValue(new Error('sin sesión'));

    const mod = await import('@/shared/utils/formatCurrency');
    await mod.initCurrency();
    expect(mod.getCurrency()).toBe('ARS');
    expect(mod.getCurrencySymbol()).toBe('$');
  });

  it('getCurrencySymbol respeta la moneda indicada sin depender de la cache', () => {
    return import('@/shared/utils/formatCurrency').then((mod) => {
      expect(mod.getCurrencySymbol('USD')).toMatch(/US\$/);
      expect(mod.getCurrencySymbol('ARS')).toBe('$');
    });
  });

  it('applyCurrency actualiza la moneda al instante', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    mod.applyCurrency('USD');
    expect(mod.getCurrency()).toBe('USD');
    expect(mod.formatCurrency(1500)).toMatch(/US\$/);
  });
});