// Frecuencias de cuota de una operación financiada.

/**
 * Frecuencias válidas para una operación en cuotas.
 *
 * Un préstamo nunca es a contado, así que `CONTADO` queda afuera: el alta de
 * préstamos y los valores por defecto de Mi Negocio ofrecen exactamente estas.
 */
export const FRECUENCIAS_DE_CUOTA = ['SEMANAL', 'QUINCENAL', 'MENSUAL'] as const;

export type FrecuenciaDeCuota = (typeof FRECUENCIAS_DE_CUOTA)[number];

/** `true` si el valor es una frecuencia de cuota válida para un préstamo. */
export const esFrecuenciaDeCuota = (valor: string | null | undefined): valor is FrecuenciaDeCuota =>
  valor != null && (FRECUENCIAS_DE_CUOTA as readonly string[]).includes(valor);