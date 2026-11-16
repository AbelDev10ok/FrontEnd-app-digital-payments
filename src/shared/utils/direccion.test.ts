import { describe, expect, it } from 'vitest';
import { formatearDireccion } from './direccion';

describe('formatearDireccion', () => {
  it('une las partes cargadas en orden', () => {
    expect(
      formatearDireccion({
        direccion: 'Av. San Martín 1234',
        localidad: 'Rafael Calzada',
        provincia: 'Buenos Aires',
        codigoPostal: 'B1847',
      }),
    ).toBe('Av. San Martín 1234, Rafael Calzada, Buenos Aires, B1847');
  });

  it('omite las partes vacías o nulas', () => {
    expect(
      formatearDireccion({
        direccion: 'Av. San Martín 1234',
        localidad: null,
        provincia: '  ',
        codigoPostal: undefined,
      }),
    ).toBe('Av. San Martín 1234');
  });

  it('devuelve cadena vacía sin ninguna parte', () => {
    expect(formatearDireccion({})).toBe('');
  });
});
