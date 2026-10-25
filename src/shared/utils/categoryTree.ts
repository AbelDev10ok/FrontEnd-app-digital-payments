import type { ProductTypeDto } from '@/shared/types/sales';

/** Categoría aplanada para selects: nivel en el árbol y si agrupa subcategorías. */
export interface CategoriaAplanada extends ProductTypeDto {
  /** Nivel en el árbol: 0 = raíz. */
  depth: number;
  /** Tiene subcategorías: sólo agrupa, los productos van en las hojas. */
  tieneHijas: boolean;
}

/**
 * Categorías agrupadas por padre y ordenadas por nombre. Una categoría con
 * padre inexistente se trata como raíz (no se pierde si el padre no vino).
 */
export function agruparCategoriasPorPadre(
  categories: ProductTypeDto[],
): Map<number | null, ProductTypeDto[]> {
  const porPadre = new Map<number | null, ProductTypeDto[]>();
  const ids = new Set(categories.map((cat) => cat.id));
  categories.forEach((cat) => {
    const padre = cat.parentId != null && ids.has(cat.parentId) ? cat.parentId : null;
    const lista = porPadre.get(padre) ?? [];
    lista.push(cat);
    porPadre.set(padre, lista);
  });
  porPadre.forEach((lista) => lista.sort((a, b) => a.name.localeCompare(b.name)));
  return porPadre;
}

/** Categorías aplanadas en orden de árbol (padres antes que sus hijas). */
export function aplanarCategorias(categories: ProductTypeDto[]): CategoriaAplanada[] {
  const porPadre = agruparCategoriasPorPadre(categories);
  const aplanadas: CategoriaAplanada[] = [];
  const visitar = (padre: number | null, depth: number) => {
    (porPadre.get(padre) ?? []).forEach((cat) => {
      aplanadas.push({ ...cat, depth, tieneHijas: (porPadre.get(cat.id) ?? []).length > 0 });
      visitar(cat.id, depth + 1);
    });
  };
  visitar(null, 0);
  return aplanadas;
}

/** Hijas, nietas, etc. de una categoría (sin incluirla). */
export function descendientesDe(categories: ProductTypeDto[], id: number): Set<number> {
  const porPadre = agruparCategoriasPorPadre(categories);
  const resultado = new Set<number>();
  const pendientes = [id];
  while (pendientes.length > 0) {
    const actual = pendientes.pop()!;
    (porPadre.get(actual) ?? []).forEach((hija) => {
      if (hija.id === id || resultado.has(hija.id)) return;
      resultado.add(hija.id);
      pendientes.push(hija.id);
    });
  }
  return resultado;
}

/** La categoría y toda su rama: filtrar por un padre trae sus subcategorías. */
export function categoriaYDescendientes(categories: ProductTypeDto[], id: number): Set<number> {
  return new Set([id, ...descendientesDe(categories, id)]);
}
