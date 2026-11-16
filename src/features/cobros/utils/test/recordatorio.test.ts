import { describe, expect, it } from 'vitest';
import { esRecordadoHoy, mensajeRecordatorioCuota, recordatorioHrefDeCuota } from '../recordatorio';
import type { CuotaItem } from '@/shared/types/business';

// Intl separa el simbolo del monto con espacio duro (U+00A0).
const sinNbsp = (texto: string) => texto.replace(/\u00a0/g, ' ');

const base = {
  nombre: 'Juan Perez',
  numeroCuota: 2,
  totalCuotas: 6,
  monto: 20000,
  moneda: 'ARS',
  fechaVencimiento: '2026-08-20',
  descripcion: null,
  tipo: 'PRESTAMO',
};

describe('mensajeRecordatorioCuota', () => {
  it('nombra la cuota, el monto y los dias de atraso', () => {
    expect(sinNbsp(mensajeRecordatorioCuota({ ...base, diasAtraso: 5 }))).toBe(
      'Hola Juan Perez, te recuerdo la cuota 2/6 de Préstamo: $ 20.000, que venció el 20/08/2026 (5 días de atraso). ¡Gracias!',
    );
  });

  it('usa el singular con un solo dia de atraso', () => {
    expect(mensajeRecordatorioCuota({ ...base, diasAtraso: 1 })).toContain('(1 día de atraso)');
  });

  it('dice que vence hoy cuando el atraso es cero', () => {
    expect(
      sinNbsp(mensajeRecordatorioCuota({
        ...base,
        nombre: 'Maria Lopez',
        numeroCuota: 1,
        totalCuotas: 12,
        monto: 15000,
        fechaVencimiento: '2026-08-25',
        descripcion: 'Televisor 32 pulgadas',
        tipo: 'VENTA',
        diasAtraso: 0,
      })),
    ).toBe(
      'Hola Maria Lopez, te recuerdo la cuota 1/12 de Televisor 32 pulgadas: $ 15.000, que vence hoy (25/08/2026). ¡Gracias!',
    );
  });

  it('avisa cuando la cuota todavia no venció', () => {
    expect(mensajeRecordatorioCuota({ ...base, diasAtraso: -2, fechaVencimiento: '2026-08-30' })).toContain(
      'que vence el 30/08/2026. ¡Gracias!',
    );
  });

  it('omite el total de cuotas cuando no lo conoce', () => {
    expect(mensajeRecordatorioCuota({ ...base, totalCuotas: null, diasAtraso: 3 })).toContain(
      'la cuota 2 de Préstamo',
    );
  });

  it('respeta la moneda de la operación', () => {
    expect(sinNbsp(mensajeRecordatorioCuota({ ...base, monto: 320, moneda: 'USD', diasAtraso: 3 }))).toContain(
      'US$ 320',
    );
  });
});

const cuota: CuotaItem = {
  id: 10,
  saleId: 2,
  clientId: 3,
  clientName: 'Maria Lopez',
  clientPhone: '+5491155551234',
  saleDescription: 'Televisor 32 pulgadas',
  saleKind: 'VENTA',
  numeroCuota: 1,
  totalCuotas: 12,
  monto: 25000,
  deudaVenta: 10000,
  fechaVencimiento: '2026-08-25',
  pagada: false,
  diasAtraso: 0,
  estado: 'TODAY',
  currency: 'ARS',
};

describe('recordatorioHrefDeCuota', () => {
  it('arma el wa.me con el mensaje y el monto cobrable de la cuota', () => {
    const href = recordatorioHrefDeCuota(cuota) ?? '';

    expect(href).toContain('https://wa.me/5491155551234?text=');
    const mensaje = sinNbsp(decodeURIComponent(href.split('text=')[1]));
    expect(mensaje).toContain('Hola Maria Lopez');
    expect(mensaje).toContain('la cuota 1/12 de Televisor 32 pulgadas');
    // El mensaje pide lo mismo que la pantalla: el tope es la deuda, no la cuota
    expect(mensaje).toContain('$ 10.000');
    expect(mensaje).not.toContain('$ 25.000');
  });

  it('no arma el enlace sin un celular interpretable', () => {
    expect(recordatorioHrefDeCuota({ ...cuota, clientPhone: null })).toBeNull();
    expect(recordatorioHrefDeCuota({ ...cuota, clientPhone: '0981-555-123' })).toBeNull();
  });

  it('no arma el enlace de una cuota ya cobrada', () => {
    expect(recordatorioHrefDeCuota({ ...cuota, pagada: true })).toBeNull();
  });
});

describe('esRecordadoHoy', () => {
  it('compara sólo la fecha del último recordatorio', () => {
    expect(esRecordadoHoy('2026-08-25T14:30:00', '2026-08-25')).toBe(true);
    expect(esRecordadoHoy('2026-08-24T23:59:59', '2026-08-25')).toBe(false);
  });

  it('sin recordatorio o sin fecha de agenda no hay nada que ocultar', () => {
    expect(esRecordadoHoy(null, '2026-08-25')).toBe(false);
    expect(esRecordadoHoy(undefined, '2026-08-25')).toBe(false);
    expect(esRecordadoHoy('2026-08-25T14:30:00', '')).toBe(false);
  });
});
