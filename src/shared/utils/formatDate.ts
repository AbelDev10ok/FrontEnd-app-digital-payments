/**
 * Utilidades de fecha en zona horaria local.
 *
 * El backend intercambia fechas como strings `YYYY-MM-DD`. Construir "hoy"
 * con `new Date().toISOString()` devuelve la fecha UTC: en UTC-3/UTC-4 a partir
 * de las 20:00/21:00 locales resulta el día MANANA, lo que fechaba ventas y
 * cobros en el futuro. Estas utilidades siempre usan la fecha local.
 */

/**
 * Fecha local de una `Date` como string ISO (YYYY-MM-DD), sin corrimientos
 * por zona horaria. Es el mismo criterio que `getTodayIso` en
 * `features/ventaDetalle/utils/feeVisualState`.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normaliza una fecha del backend (`YYYY-MM-DD` o ISO con hora) al valor de
 * un `<input type="date">` sin corrimientos de zona horaria: los strings
 * `YYYY-MM-DD` se toman tal cual; solo las fechas con hora se normalizan.
 */
export function toInputDate(dateString: string): string {
  const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(dateString);
  if (dateOnly) return dateOnly[1];
  return getLocalDateString(new Date(dateString));
}

/**
 * Fecha y hora legibles sin pasar por `Date`, para no correr la hora por zona
 * horaria. El backend sella el horario de los cobros y lo envía como fecha
 * local sin zona: `2026-11-12T15:45:30` → `12/11/2026 · 15:45`.
 * Un string solo-fecha (`2026-11-12`) se devuelve como `12/11/2026`.
 */
export function formatDateHour(iso: string): string {
  const fecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const dia = fecha ? `${fecha[3]}/${fecha[2]}/${fecha[1]}` : iso;
  const hora = /[T ](\d{2}):(\d{2})/.exec(iso);
  return hora ? `${dia} · ${hora[1]}:${hora[2]}` : dia;
}
