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

  it('formatea cero', () => {
    expect(formatCurrency(0)).toMatch(/^\$\s*0$/);
  });

  it('formatea montos negativos con signo', () => {
    expect(formatCurrency(-500)).toContain('500');
    expect(formatCurrency(-500)).not.toBe(formatCurrency(500));
  });

  it('redondea montos con decimales', () => {
    expect(formatCurrency(1500.4)).toContain('1.500');
  });

  it('formatea montos grandes con separadores', () => {
    expect(formatCurrency(1234567)).toContain('1.234.567');
  });

  it('muestra decimales en montos menores a 1 (centavos)', () => {
    expect(formatCurrency(0.08)).toContain('0,08');
    expect(formatCurrency(0.08)).not.toMatch(/^\$\s*0$/);
  });

  it('muestra decimales en montos negativos menores a 1', () => {
    expect(formatCurrency(-0.5)).toContain('0,5');
  });

  it('mantiene cero sin decimales', () => {
    expect(formatCurrency(0)).toMatch(/^\$\s*0$/);
  });

  it('mantiene montos de 1 o más sin decimales', () => {
    expect(formatCurrency(1)).toMatch(/^\$\s*1$/);
    expect(formatCurrency(1.5)).not.toContain(',');
  });
});
