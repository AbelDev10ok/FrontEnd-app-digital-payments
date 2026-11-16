/**
 * Normaliza texto para buscar: minúsculas, sin acentos y sin separadores.
 *
 * Los separadores se convierten en un espacio para que "Ram: 4" y "ram 4"
 * matcheen igual: el usuario escribe el atributo como lo dice, no como se
 * muestra. Sin esto, buscar "ram 4" no encontraba nada porque el haystack
 * guardaba "Ram: 4".
 *
 * Un texto que queda vacío (sólo separadores) no filtra: el llamador lo trata
 * como búsqueda vacía.
 */
export function normalizarBusqueda(texto: string | null | undefined): string {
  return (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
