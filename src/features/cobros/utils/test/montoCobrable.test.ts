import { describe, expect, it } from 'vitest';
import { montoCobrable, montoCobrableDeCuota } from '../montoCobrable';
import type { CuotaItem } from '@/shared/types/business';

const cuota = (overrides: Partial<CuotaItem> = {}): CuotaItem => ({
  id: 1,
  saleId: 10,
  clientId: 5,
  clientName: 'Juana Pérez',
  numeroCuota: 2,
  monto: 25000,
  fechaVencimiento: '2026-09-01',
  pagada: false,
  diasAtraso: 0,
  estado: 'UPCOMING',
  ...overrides,
});

describe('montoCobrable', () => {
  it('acota al monto de la cuota cuando la deuda de la venta es menor', () => {
    expect(montoCobrable(25000, 10000)).toBe(10000);
  });

  it('deja el monto de la cuota cuando la deuda es mayor', () => {
    expect(montoCobrable(25000, 60000)).toBe(25000);
  });

  it('deja el monto de la cuota sin deuda informada', () => {
    expect(montoCobrable(25000, null)).toBe(25000);
    expect(montoCobrable(25000, undefined)).toBe(25000);
  });

  it('deja el monto de la cuota cuando la venta no debe nada y la cuota tampoco', () => {
    expect(montoCobrable(0, 0)).toBe(0);
  });

  it('acota a cero cuando la venta no debe nada', () => {
    // Una venta saldada no tiene nada que cobrar: el mismo tope que usan los
    // totales del backend (una cuota con deuda cero suma cero)
    expect(montoCobrable(25000, 0)).toBe(0);
  });

  it('sin monto de cuota devuelve cero', () => {
    expect(montoCobrable(null, 10000)).toBe(0);
  });
});

describe('montoCobrableDeCuota', () => {
  it('acota la cuota impaga a la deuda de la venta', () => {
    expect(montoCobrableDeCuota(cuota({ monto: 25000, deudaVenta: 10000 }))).toBe(10000);
  });

  it('deja el monto de la cuota impaga cuando la deuda es mayor', () => {
    expect(montoCobrableDeCuota(cuota({ monto: 25000, deudaVenta: 150000 }))).toBe(25000);
  });

  it('en una cuota ya cobrada muestra su monto y no la deuda que queda', () => {
    expect(montoCobrableDeCuota(cuota({ monto: 25000, deudaVenta: 5000, pagada: true }))).toBe(25000);
  });
});
