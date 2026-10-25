/**
 * Monedas que la app ofrece explícitamente (ISO 4217).
 *
 * Es la única fuente de verdad del frontend (la misma lista valida el backend):
 * la usan el selector de Mi Negocio y el filtro del dashboard. Acotar la lista
 * evita que un tipeo cree una moneda paralela que nunca se junta con la que se
 * quiso usar — la moneda queda congelada al crear el registro y no se edita.
 */
export const MONEDAS_SOPORTADAS = ["ARS", "USD"] as const;

export type MonedaSoportada = (typeof MONEDAS_SOPORTADAS)[number];

/** ¿Es una de las monedas soportadas? (normaliza a mayúsculas) */
export function esMonedaSoportada(moneda?: string | null): boolean {
  return MONEDAS_SOPORTADAS.includes((moneda ?? "").trim().toUpperCase() as MonedaSoportada);
}

const ETIQUETAS: Record<string, string> = {
  ARS: "ARS — Peso argentino",
  USD: "USD — Dólar estadounidense",
};

/** Etiqueta legible para el selector; un código desconocido se muestra tal cual. */
export function etiquetaMoneda(moneda: string): string {
  return ETIQUETAS[moneda.trim().toUpperCase()] ?? moneda;
}

/**
 * Opciones del selector de moneda del negocio: las soportadas más la que el
 * negocio ya tiene, si es un dato legado fuera de la lista. Incluirla evita
 * dejar el <select> con un valor que no tiene opción (se vería vacío).
 */
export function opcionesMonedaNegocio(actual?: string | null): string[] {
  const opciones = new Set<string>(MONEDAS_SOPORTADAS);
  const codigo = (actual ?? "").trim().toUpperCase();
  if (codigo && !esMonedaSoportada(codigo)) {
    opciones.add(codigo);
  }
  return [...opciones];
}
