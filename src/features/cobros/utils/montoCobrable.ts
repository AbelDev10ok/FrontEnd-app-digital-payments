import type { CuotaItem } from '@/shared/types/business';

/**
 * Monto con el que se muestra (y se cobra) una cuota: el de la cuota, salvo que la
 * deuda de la venta sea menor. Una cuota impaga puede quedar por encima de lo que la
 * venta debe (por ejemplo la última reprogramada), y lo único que se puede cobrar es
 * la deuda: el backend rechaza cobrar más que eso y sus totales usan el mismo tope
 * (una cuota con deuda cero suma cero).
 *
 * Sin deuda informada (nula) se devuelve el monto de la cuota: no hay nada que acotar.
 */
export const montoCobrable = (
  montoCuota: number | null | undefined,
  deudaVenta?: number | null,
): number => {
  const monto = montoCuota ?? 0;
  if (deudaVenta == null) {
    return monto;
  }
  return Math.min(monto, Math.max(deudaVenta, 0));
};

/**
 * Igual que {@link montoCobrable} pero a partir de la cuota del listado. En una cuota
 * ya cobrada se muestra su monto (lo cobrado): la deuda que quede es para las cuotas
 * por cobrar, no para ella.
 */
export const montoCobrableDeCuota = (
  cuota: Pick<CuotaItem, 'monto' | 'deudaVenta' | 'pagada'>,
): number => montoCobrable(cuota.monto, cuota.pagada ? null : cuota.deudaVenta);
