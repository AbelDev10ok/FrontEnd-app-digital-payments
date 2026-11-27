import { describe, expect, it } from 'vitest';
import { collectableSubtotal, groupByClientAndCurrency } from '../clientGroups';
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

describe('collectableSubtotal', () => {
  it('sums the fees of one client in one currency', () => {
    expect(collectableSubtotal([cuota({ monto: 15000 }), cuota({ id: 2, monto: 10000 })])).toBe(25000);
  });

  it('caps the sum of each operation at the operation debt', () => {
    // Two fees of 25.000 in a sale that only owes 20.000: the cap is the debt.
    const cuotas = [
      cuota({ id: 1, monto: 25000, deudaVenta: 20000 }),
      cuota({ id: 2, monto: 25000, deudaVenta: 20000 }),
    ];
    expect(collectableSubtotal(cuotas)).toBe(20000);
  });

  it('adds the capped amounts of different operations', () => {
    const cuotas = [
      cuota({ id: 1, saleId: 10, monto: 25000, deudaVenta: 20000 }),
      cuota({ id: 2, saleId: 11, monto: 5000, deudaVenta: 50000 }),
    ];
    expect(collectableSubtotal(cuotas)).toBe(25000);
  });

  it('leaves an operation without informed debt uncapped', () => {
    expect(collectableSubtotal([cuota({ monto: 25000, deudaVenta: null })])).toBe(25000);
  });

  it('does not count fees already paid', () => {
    const cuotas = [cuota({ id: 1, monto: 15000 }), cuota({ id: 2, monto: 10000, pagada: true })];
    expect(collectableSubtotal(cuotas)).toBe(15000);
  });

  it('caps at zero when the operation owes nothing', () => {
    expect(collectableSubtotal([cuota({ monto: 25000, deudaVenta: 0 })])).toBe(0);
  });

  it('treats a missing fee amount as zero', () => {
    expect(collectableSubtotal([cuota({ monto: null })])).toBe(0);
  });
});

describe('groupByClientAndCurrency', () => {
  it('groups the agenda by client and currency', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS' }),
      cuota({ id: 2, clientId: 5, currency: 'ARS', saleId: 11 }),
      cuota({ id: 3, clientId: 6, currency: 'ARS' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].clientId).toBe(5);
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].clientId).toBe(6);
    expect(groups[1].items).toHaveLength(1);
  });

  it('keeps one group per currency for the same client', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS', monto: 10000 }),
      cuota({ id: 2, clientId: 5, currency: 'USD', saleId: 11, monto: 20 }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.currency)).toEqual(['ARS', 'USD']);
    // Currencies are never summed: each group keeps its own subtotal.
    expect(groups[0].subtotal).toBe(10000);
    expect(groups[1].subtotal).toBe(20);
  });

  it('caps the group subtotal per operation', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS', monto: 25000, deudaVenta: 20000 }),
      cuota({ id: 2, clientId: 5, currency: 'ARS', saleId: 11, monto: 5000, deudaVenta: 50000 }),
    ]);

    expect(groups[0].subtotal).toBe(25000);
  });

  it('exposes the client debt in the currency when every operation reports it', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS', deudaVenta: 20000 }),
      cuota({ id: 2, clientId: 5, currency: 'ARS', saleId: 11, deudaVenta: 5000 }),
    ]);

    expect(groups[0].debt).toBe(25000);
  });

  it('reports an unknown debt when an operation does not report it', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS', deudaVenta: 20000 }),
      cuota({ id: 2, clientId: 5, currency: 'ARS', saleId: 11, deudaVenta: null }),
    ]);

    expect(groups[0].debt).toBeNull();
  });

  it('completes the client identity with the first value available in the group', () => {
    const groups = groupByClientAndCurrency([
      cuota({ id: 1, clientId: 5, currency: 'ARS', clientName: 'Ana', clientPhone: null, clientAddress: null }),
      cuota({
        id: 2,
        clientId: 5,
        currency: 'ARS',
        clientName: 'Ana',
        clientPhone: '+5491155551234',
        clientAddress: 'Av. Siempre Viva 123',
      }),
    ]);

    expect(groups[0].clientName).toBe('Ana');
    expect(groups[0].clientPhone).toBe('+5491155551234');
    expect(groups[0].clientAddress).toBe('Av. Siempre Viva 123');
  });
});
