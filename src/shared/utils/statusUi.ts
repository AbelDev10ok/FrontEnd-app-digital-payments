import type { BadgeTone } from '@/shared/components/ui/Badge';

/**
 * Fuente unica de verdad para los colores de estado de ventas/cuotas.
 * La landing usa: brand (positivo propio), emerald (completado),
 * amber (pendiente/proximo) y red (vencido/urgente). Ningun otro color
 * semantico (orange/teal/yellow/green) esta permitido en la app.
 */

export type SaleStatus = 'A_COBRAR' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  A_COBRAR: 'A Cobrar',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELED: 'Cancelada',
};

export const SALE_STATUS_TONE: Record<SaleStatus, BadgeTone> = {
  A_COBRAR: 'danger',
  ACTIVE: 'warning',
  COMPLETED: 'success',
  CANCELED: 'neutral',
};

/** Clase del punto de color para listados compactos (sidebar, chips). */
export const SALE_STATUS_DOT: Record<SaleStatus, string> = {
  A_COBRAR: 'bg-red-500',
  ACTIVE: 'bg-amber-500',
  COMPLETED: 'bg-emerald-500',
  CANCELED: 'bg-gray-400',
};

export function isSaleStatus(status?: string | null): status is SaleStatus {
  return (
    status === 'A_COBRAR' ||
    status === 'ACTIVE' ||
    status === 'COMPLETED' ||
    status === 'CANCELED'
  );
}

export function saleStatusLabel(status?: string | null): string {
  return isSaleStatus(status) ? SALE_STATUS_LABEL[status] : status ?? '';
}

export function saleStatusTone(status?: string | null): BadgeTone {
  return isSaleStatus(status) ? SALE_STATUS_TONE[status] : 'neutral';
}

export function saleStatusDot(status?: string | null): string {
  return isSaleStatus(status) ? SALE_STATUS_DOT[status] : 'bg-gray-400';
}
