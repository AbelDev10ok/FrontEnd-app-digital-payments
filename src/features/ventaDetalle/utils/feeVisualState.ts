import type { FeeDto } from '@/shared/types/sales';

export type FeeVisualState = 'pagada' | 'vencida' | 'proxima';

/**
 * Fecha local de hoy como string ISO (YYYY-MM-DD), sin depender de zonas horarias.
 * El backend envía las fechas en ese formato.
 */
export const getTodayIso = (now: Date = new Date()): string => {
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const estaVencida = (fee: FeeDto, todayIso: string): boolean =>
  !fee.paid && fee.expirationDate < todayIso;

/**
 * Estado visual de una cuota individual. La comparación de fechas es por
 * string YYYY-MM-DD para evitar desfases de zona horaria; el día exacto de
 * vencimiento todavía NO cuenta como vencida.
 *
 * Precedencia: pagada > vencida > próxima.
 */
export const getFeeVisualState = (fee: FeeDto, todayIso: string = getTodayIso()): FeeVisualState => {
  if (fee.paid) return 'pagada';
  if (estaVencida(fee, todayIso)) return 'vencida';
  return 'proxima';
};

/**
 * Calcula los estados de todo el cronograma: cada cuota impaga futura o con
 * vencimiento de hoy se marca como "próxima"; las vencidas y pagadas según
 * corresponda.
 */
export const getFeeListStates = (fees: FeeDto[], todayIso: string = getTodayIso()): FeeVisualState[] =>
  fees.map((fee) => getFeeVisualState(fee, todayIso));
