import { describe, expect, it } from 'vitest';
import type { ProductDto, VariantAttributeDto } from '@/shared/types/sales';
import { especificacionesDe, resumenEspecificaciones } from './productSpecs';

const atributo = (attributeName: string, value: string, id = 1): VariantAttributeDto => ({
  attributeId: id,
  attributeName,
  attributeValueId: id * 10,
  value,
});

const variante = (overrides: Partial<ProductDto> = {}): ProductDto => ({
  id: 1,
  variantId: 11,
  name: 'Samsung Galaxy A16',
  ...overrides,
});

describe('especificacionesDe', () => {
  it('compone nombre y valor de cada atributo', () => {
    const producto = variante({
      attributes: [
        { attributeId: 1, attributeName: 'Color', attributeValueId: 10, value: 'Rojo' },
        { attributeId: 2, attributeName: 'RAM', attributeValueId: 20, value: '4 GB' },
      ],
    });

    expect(especificacionesDe(producto)).toEqual(['Color: Rojo', 'RAM: 4 GB']);
  });

  it('no repite el nombre del atributo cuando el valor ya lo incluye', () => {
    const producto = variante({
      attributes: [{ attributeId: 1, attributeName: 'RAM', attributeValueId: 10, value: '4GB RAM' }],
    });

    expect(especificacionesDe(producto)).toEqual(['4GB RAM']);
  });

  it('deduplica valores repetidos sin importar mayúsculas ni tildes', () => {
    const producto = variante({
      attributes: [
        { attributeId: 1, attributeName: 'Color', attributeValueId: 10, value: 'Rojo' },
        { attributeId: 2, attributeName: 'Color', attributeValueId: 11, value: 'ROJO' },
      ],
    });

    expect(especificacionesDe(producto)).toEqual(['Color: Rojo']);
  });

  it('cae a la etiqueta del backend cuando la variante no tiene atributos', () => {
    expect(especificacionesDe(variante({ variantLabel: 'Rojo / M' }))).toEqual(['Rojo / M']);
    expect(especificacionesDe(variante())).toEqual([]);
  });
});

describe('resumenEspecificaciones', () => {
  it('agrupa por atributo y une los valores distintos de todas las variantes', () => {
    const variantes = [
      variante({ variantId: 11, attributes: [atributo('Color', 'Rojo', 1), atributo('RAM', '4 GB', 2)] }),
      variante({ variantId: 12, attributes: [atributo('Color', 'Negro', 1), atributo('RAM', '8 GB', 2)] }),
    ];

    expect(resumenEspecificaciones(variantes)).toBe('Color: Rojo / Negro · RAM: 4 GB / 8 GB');
  });

  it('recorta a tres bloques con un "+N más"', () => {
    const variantes = [
      variante({
        attributes: [
          atributo('Color', 'Rojo', 1),
          atributo('RAM', '4 GB', 2),
          atributo('Almacenamiento', '128 GB', 3),
          atributo('Batería', '5000 mAh', 4),
        ],
      }),
    ];

    expect(resumenEspecificaciones(variantes)).toBe(
      'Color: Rojo · RAM: 4 GB · Almacenamiento: 128 GB · +1 más',
    );
  });

  it('mantiene sin prefijo los valores que ya nombran a su atributo', () => {
    const variantes = [
      variante({ variantId: 11, attributes: [atributo('RAM', '4GB RAM', 1)] }),
      variante({ variantId: 12, attributes: [atributo('RAM', '8GB RAM', 1)] }),
    ];

    expect(resumenEspecificaciones(variantes)).toBe('4GB RAM / 8GB RAM');
  });

  it('cae a las etiquetas de las variantes cuando no hay atributos', () => {
    expect(resumenEspecificaciones([variante({ variantLabel: 'Inox' })])).toBe('Inox');
    expect(resumenEspecificaciones([variante()])).toBe('');
  });
});