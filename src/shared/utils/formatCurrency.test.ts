import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formatea montos en ARS sin decimales', () => {
    expect(formatCurrency(1500)).toMatch(/^\$\s*1\.500$/);
  });

  it('respeta la moneda indicada', () => {
    expect(formatCurrency(1500, 'USD')).toMatch(/^US\$\s*1\.500$/);
  });

  it('usa fallback si la moneda es inválida', () => {
    expect(formatCurrency(1500, 'NO-EXISTE')).toBe('1500.00 NO-EXISTE');
  });

  it('no lanza error con montos NaN', () => {
    expect(formatCurrency(NaN)).toContain('NaN');
  });
});
