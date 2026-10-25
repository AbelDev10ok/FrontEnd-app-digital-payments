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

describe('montos por moneda (snapshot por registro)', () => {
  it('formatCurrency usa la moneda del registro aunque la global sea otra', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    mod.applyCurrency('USD');
    // Un registro histórico en ARS se muestra con SU moneda (congelada al
    // crearlo), no con la moneda vigente del negocio
    expect(mod.formatCurrency(15000, 'ARS')).toMatch(/\$\s*15[.]000/);
    expect(mod.formatCurrency(320, 'USD')).toMatch(/US\$\s*320/);
  });

  it('formatMoneyByCurrency muestra cada monto con su moneda y nunca los suma', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    const resultado = mod.formatMoneyByCurrency({ ARS: 150000, USD: 320 });
    expect(resultado).toBe(
      `${mod.formatCurrency(150000, 'ARS')} · ${mod.formatCurrency(320, 'USD')}`,
    );
    expect(resultado).toContain('150.000');
    expect(resultado).toContain('320');
  });

  it('formatMoneyByCurrency con una sola moneda la formatea directo', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    expect(mod.formatMoneyByCurrency({ USD: 990 })).toBe(mod.formatCurrency(990, 'USD'));
    expect(mod.formatMoneyByCurrency({})).toBe('');
    expect(mod.formatMoneyByCurrency(null)).toBe('');
  });

  it('mergeMoney suma solo dentro de cada moneda', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    expect(
      mod.mergeMoney({ ARS: 100, USD: 10 }, { ARS: 50, EUR: 5 }, undefined),
    ).toEqual({ ARS: 150, USD: 10, EUR: 5 });
  });

  it('hasMoney detecta agregados sin montos', async () => {
    const mod = await import('@/shared/utils/formatCurrency');
    expect(mod.hasMoney({})).toBe(false);
    expect(mod.hasMoney(null)).toBe(false);
    expect(mod.hasMoney({ ARS: 0 })).toBe(true);
  });
});