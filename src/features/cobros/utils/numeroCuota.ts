/**
 * Total del plan que acompaña al número de cuota ("Cuota 7 de 6", "7 / 6").
 *
 * Con el cronograma fijo el plan se materializa completo al crear la operación y
 * ya no se generan "cuotas extra" al cobrar (los pagos parciales dejaron de
 * repartir la deuda en más cuotas). El guard de `numeroCuota > totalCuotas` queda
 * como tolerancia a datos legados: el número sigue siendo el real, pero el total
 * ya no describe esa cuota.
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
