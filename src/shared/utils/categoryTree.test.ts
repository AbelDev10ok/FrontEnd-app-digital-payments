import { describe, expect, it } from 'vitest';
import type { ProductTypeDto } from '@/shared/types/sales';
import {
  agruparCategoriasPorPadre,
  aplanarCategorias,
  categoriaYDescendientes,
  descendientesDe,
} from './categoryTree';

const categorias: ProductTypeDto[] = [
  { id: 1, name: 'CELULARES' },
  { id: 2, name: 'SAMSUNG', parentId: 1 },
  { id: 3, name: 'A16', parentId: 2 },
  { id: 4, name: 'TV' },
  { id: 9, name: 'HUÉRFANA', parentId: 99 },
];

describe('agruparCategoriasPorPadre', () => {
  it('agrupa por padre y ordena por nombre, con las huérfanas en la raíz', () => {
    const porPadre = agruparCategoriasPorPadre(categorias);

    expect(porPadre.get(null)?.map((cat) => cat.name)).toEqual(['CELULARES', 'HUÉRFANA', 'TV']);
    expect(porPadre.get(1)?.map((cat) => cat.name)).toEqual(['SAMSUNG']);
  });
});

describe('aplanarCategorias', () => {
  it('aplana en orden de árbol con nivel y si tiene hijas', () => {
    expect(
      aplanarCategorias(categorias).map(({ id, depth, tieneHijas }) => ({ id, depth, tieneHijas })),
    ).toEqual([
      { id: 1, depth: 0, tieneHijas: true },
      { id: 2, depth: 1, tieneHijas: true },
      { id: 3, depth: 2, tieneHijas: false },
      { id: 9, depth: 0, tieneHijas: false },
      { id: 4, depth: 0, tieneHijas: false },
    ]);
  });
});

describe('descendientesDe', () => {
  it('devuelve hijas y nietas sin incluir la categoría', () => {
    expect(descendientesDe(categorias, 1)).toEqual(new Set([2, 3]));
    expect(descendientesDe(categorias, 3)).toEqual(new Set());
  });

  it('no se cuelga si los datos vinieran con un ciclo', () => {
    const ciclo: ProductTypeDto[] = [
      { id: 5, name: 'A', parentId: 6 },
      { id: 6, name: 'B', parentId: 5 },
    ];

    expect(descendientesDe(ciclo, 5)).toEqual(new Set([6]));
  });
});

describe('categoriaYDescendientes', () => {
  it('incluye la categoría elegida además de su rama', () => {
    expect(categoriaYDescendientes(categorias, 1)).toEqual(new Set([1, 2, 3]));
    expect(categoriaYDescendientes(categorias, 4)).toEqual(new Set([4]));
  });
});
