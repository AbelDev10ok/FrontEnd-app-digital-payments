/**
 * Total del plan que acompaña al número de cuota ("Cuota 7 de 6", "7 / 6").
 *
 * Los pagos parciales generan cuotas que ya no pertenecen al plan acordado (una
 * sexta parte cobrada obliga a repartir el resto en más cuotas), así que a partir
 * de la cuota siguiente al total acordado el "de N" se calla: el número sigue
 * siendo el real, pero el total ya no describe esa cuota.
 *
 * Sin total informado (dato legado) o con un total no positivo se devuelve cadena
 * vacía, igual que antes de este helper. El conector lo elige cada pantalla.
 */
export const sufijoTotalCuotas = (
  numeroCuota: number | null | undefined,
  totalCuotas: number | null | undefined,
  conector: 'de' | '/',
): string => {
  if (!numeroCuota || !totalCuotas || totalCuotas <= 0) {
    return '';
  }
  if (numeroCuota > totalCuotas) {
    return '';
  }
  return ` ${conector} ${totalCuotas}`;
};
