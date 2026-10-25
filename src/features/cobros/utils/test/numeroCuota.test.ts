import { describe, expect, it } from 'vitest';
import { sufijoTotalCuotas } from '../numeroCuota';

describe('sufijoTotalCuotas', () => {
  it('muestra el total mientras la cuota pertenece al plan', () => {
    expect(sufijoTotalCuotas(2, 6, 'de')).toBe(' de 6');
    expect(sufijoTotalCuotas(6, 6, 'de')).toBe(' de 6');
    expect(sufijoTotalCuotas(1, 12, '/')).toBe(' / 12');
  });

  it('oculta el total en las cuotas extra que generan los pagos parciales', () => {
    // Una venta de 6 cuotas con pagos parciales necesita más cuotas: la 7 es
    // real, pero el "de 6" ya no la describe
    expect(sufijoTotalCuotas(7, 6, 'de')).toBe('');
    expect(sufijoTotalCuotas(8, 6, '/')).toBe('');
  });

  it('no muestra total sin dato de plan', () => {
    expect(sufijoTotalCuotas(2, null, 'de')).toBe('');
    expect(sufijoTotalCuotas(2, undefined, 'de')).toBe('');
  });

  it('no muestra total con un plan no positivo', () => {
    expect(sufijoTotalCuotas(1, 0, 'de')).toBe('');
    expect(sufijoTotalCuotas(1, -1, 'de')).toBe('');
  });

  it('no muestra total sin número de cuota', () => {
    expect(sufijoTotalCuotas(null, 6, 'de')).toBe('');
    expect(sufijoTotalCuotas(undefined, 6, 'de')).toBe('');
  });
});
