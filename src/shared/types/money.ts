/**
 * Montos agregados por moneda ISO 4217, p. ej. `{ ARS: 150000, USD: 320 }`.
 *
 * Regla de dominio: las monedas distintas nunca se suman entre sí; cada monto
 * queda etiquetado con su moneda. El backend devuelve estas formas en todas las
 * métricas monetarias agregadas (dashboard, cobros, deudas).
 */
export type MontosPorMoneda = Record<string, number>;
