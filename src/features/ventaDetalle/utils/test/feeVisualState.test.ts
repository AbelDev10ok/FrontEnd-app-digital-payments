import { describe, expect, it } from 'vitest';
import {
  getFeeListStates,
  getFeeVisualState,
  getTodayIso,
} from '../feeVisualState';
import type { FeeDto } from '@/shared/types/sales';

const HOY = '2026-08-24';

const crearCuota = (overrides: Partial<FeeDto> = {}): FeeDto => ({
  id: 1,
  saleId: 1,
  numberFee: 1,
  amount: 15000,
  expirationDate: '2026-09-01',
  paid: false,
  paymentDate: undefined,
  paidAmount: undefined,
  postponed: false,
  productDescription: 'TV 32',
  status: 'PENDING',
  ...overrides,
});

describe('getTodayIso', () => {
  it('devuelve la fecha local en formato YYYY-MM-DD sin desfase de zona horaria', () => {
    // 2026-03-01 00:30 en zona UTC-3 sería 2026-02-28 en UTC
    const fecha = new Date(2026, 2, 1, 0, 30);
    expect(getTodayIso(fecha)).toBe('2026-03-01');
  });
});

describe('getFeeVisualState', () => {
  it('una cuota pagada siempre está pagada, aunque su fecha haya vencido', () => {
    const cuota = crearCuota({ paid: true, expirationDate: '2026-01-01' });
    expect(getFeeVisualState(cuota, HOY)).toBe('pagada');
  });

  it('una cuota impaga con fecha anterior a hoy está vencida', () => {
    const cuota = crearCuota({ expirationDate: '2026-08-23' });
    expect(getFeeVisualState(cuota, HOY)).toBe('vencida');
  });

  it('el día exacto del vencimiento todavía NO cuenta como vencida', () => {
    const cuota = crearCuota({ expirationDate: HOY });
    expect(getFeeVisualState(cuota, HOY)).toBe('proxima');
  });

  it('una cuota impaga pospuesta con fecha futura se muestra como próxima', () => {
    const cuota = crearCuota({ postponed: true, expirationDate: '2026-10-15' });
    expect(getFeeVisualState(cuota, HOY)).toBe('proxima');
  });

  it('una cuota impaga con fecha vencida se muestra como vencida aunque esté pospuesta', () => {
    const cuota = crearCuota({ postponed: true, expirationDate: '2026-08-01' });
    expect(getFeeVisualState(cuota, HOY)).toBe('vencida');
  });

  it('una cuota futura sin pagar queda próxima', () => {
    const cuota = crearCuota({ expirationDate: '2026-12-01' });
    expect(getFeeVisualState(cuota, HOY)).toBe('proxima');
  });

  it('usa la fecha de hoy real si no se pasa una explícita', () => {
    const cuota = crearCuota({ expirationDate: '2000-01-01' });
    expect(getFeeVisualState(cuota)).toBe('vencida');
  });
});

describe('getFeeListStates', () => {
  it('marca como próximas todas las cuotas futuras sin pagar', () => {
    const cuotas = [
      crearCuota({ id: 1, numberFee: 1, paid: true, status: 'PAID' }),
      crearCuota({ id: 2, numberFee: 2, expirationDate: '2026-08-20' }),
      crearCuota({ id: 3, numberFee: 3 }),
      crearCuota({ id: 4, numberFee: 4, expirationDate: '2026-12-01' }),
    ];
    expect(getFeeListStates(cuotas, HOY)).toEqual([
      'pagada',
      'vencida',
      'proxima',
      'proxima',
    ]);
  });

  it('no marca ninguna como próxima si todas las impagas están vencidas', () => {
    const cuotas = [
      crearCuota({ id: 1, numberFee: 1, expirationDate: '2026-07-01' }),
      crearCuota({ id: 2, numberFee: 2, expirationDate: '2026-08-01' }),
    ];
    expect(getFeeListStates(cuotas, HOY)).toEqual(['vencida', 'vencida']);
  });

  it('devuelve un arreglo vacío para un cronograma sin cuotas', () => {
    expect(getFeeListStates([], HOY)).toEqual([]);
  });
});
