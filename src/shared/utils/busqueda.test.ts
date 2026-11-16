import { describe, expect, it } from 'vitest';
import { normalizarBusqueda } from './busqueda';

describe('normalizarBusqueda', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(normalizarBusqueda('TELÉFONO')).toBe('telefono');
  });

  it('convierte los separadores en espacios', () => {
    // El caso que rompía: el atributo se muestra "Ram: 4".
    expect(normalizarBusqueda('Ram: 4')).toBe('ram 4');
    expect(normalizarBusqueda('A16-1')).toBe('a16 1');
  });

  it('colapsa separadores repetidos', () => {
    expect(normalizarBusqueda('Color: Rojo / Negro')).toBe('color rojo negro');
  });

  it('recorta los separadores de los extremos', () => {
    expect(normalizarBusqueda('  LG  ')).toBe('lg');
    expect(normalizarBusqueda('(4GB)')).toBe('4gb');
  });

  it('devuelve vacío cuando no hay nada buscable', () => {
    expect(normalizarBusqueda('')).toBe('');
    expect(normalizarBusqueda('  -  ')).toBe('');
    expect(normalizarBusqueda(null)).toBe('');
    expect(normalizarBusqueda(undefined)).toBe('');
  });
});
