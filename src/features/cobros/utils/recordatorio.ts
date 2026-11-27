import { formatCurrency } from '@/shared/utils/formatCurrency';
import { buildWhatsAppUrl } from '@/shared/utils/telefono';
import { montoCobrableDeCuota } from '@/features/cobros/utils/montoCobrable';
import type { CuotaItem } from '@/shared/types/business';

/**
 * Datos mínimos de una cuota para armarle un recordatorio al cliente.
 * El monto debe venir ya acotado a la deuda de la venta (ver
 * `montoCobrableDeCuota`): el mensaje tiene que pedir lo mismo que la pantalla.
 */
export interface RecordatorioCuotaInput {
  nombre: string;
  numeroCuota?: number | null;
  totalCuotas?: number | null;
  monto: number;
  moneda?: string | null;
  fechaVencimiento?: string | null;
  diasAtraso?: number | null;
  descripcion?: string | null;
  /** VENTA | PRESTAMO: sólo se usa cuando no hay descripción. */
  tipo?: string | null;
}

/** Fecha `YYYY-MM-DD` como `DD/MM/YYYY`, sin pasar por Date (no corre por zona). */
const fechaCorta = (iso?: string | null): string => (iso ? iso.split('-').reverse().join('/') : '');

const descripcionDe = (cuota: RecordatorioCuotaInput): string => {
  const texto = cuota.descripcion?.trim();
  if (texto) {
    return texto;
  }
  return cuota.tipo === 'PRESTAMO' ? 'Préstamo' : 'Venta';
};

const cuotaDe = (cuota: RecordatorioCuotaInput): string | null => {
  if (cuota.numeroCuota == null) {
    return null;
  }
  // El total se omite cuando no describe la cuota (pago parcial que generó una
  // cuota extra), igual que en la agenda.
  const total =
    cuota.totalCuotas != null && cuota.numeroCuota <= cuota.totalCuotas ? `/${cuota.totalCuotas}` : '';
  return `${cuota.numeroCuota}${total}`;
};

const vencimientoDe = (cuota: RecordatorioCuotaInput): string => {
  const fecha = fechaCorta(cuota.fechaVencimiento);
  const dias = cuota.diasAtraso;
  if (dias != null && dias > 0) {
    return `que venció el ${fecha} (${dias} ${dias === 1 ? 'día' : 'días'} de atraso)`;
  }
  if (dias === 0) {
    return fecha ? `que vence hoy (${fecha})` : 'que vence hoy';
  }
  return fecha ? `que vence el ${fecha}` : 'que está pendiente';
};

/**
 * Mensaje de recordatorio de una cuota para mandar por WhatsApp: dice quién es,
 * qué cuota, cuánto y si está vencida. Manual y en primera persona del negocio:
 * lo manda el usuario desde su propio WhatsApp.
 */
export function mensajeRecordatorioCuota(cuota: RecordatorioCuotaInput): string {
  const descripcion = descripcionDe(cuota);
  const numero = cuotaDe(cuota);
  const concepto = numero ? `la cuota ${numero} de ${descripcion}` : `el pago de ${descripcion}`;
  const monto = formatCurrency(cuota.monto, cuota.moneda ?? undefined);
  return `Hola ${cuota.nombre}, te recuerdo ${concepto}: ${monto}, ${vencimientoDe(cuota)}. ¡Gracias!`;
}

/**
 * URL de WhatsApp con el recordatorio de la cuota ya escrito. Es la única fuente
 * del mensaje: la fila de la agenda y el modo ronda usan exactamente este enlace.
 * Devuelve null si la cuota ya está cobrada o si el teléfono no es un celular
 * interpretable (wa.me no abre un chat de línea fija).
 */
export function mensajeRecordatorioDeCuota(cuota: CuotaItem): string {
  return mensajeRecordatorioCuota({
    nombre: cuota.clientName,
    numeroCuota: cuota.numeroCuota,
    totalCuotas: cuota.totalCuotas,
    // El mensaje pide lo mismo que se muestra: el tope es la deuda.
    monto: montoCobrableDeCuota(cuota),
    moneda: cuota.currency,
    fechaVencimiento: cuota.fechaVencimiento,
    diasAtraso: cuota.diasAtraso,
    descripcion: cuota.saleDescription,
    tipo: cuota.saleKind,
  });
}

export function recordatorioHrefDeCuota(cuota: CuotaItem): string | null {
  if (cuota.pagada) {
    return null;
  }
  return buildWhatsAppUrl(cuota.clientPhone, mensajeRecordatorioDeCuota(cuota));
}

/** `true` si el último recordatorio cayó en la fecha de la agenda (`YYYY-MM-DD`). */
export function esRecordadoHoy(
  ultimoRecordatorio: string | null | undefined,
  fecha: string,
): boolean {
  if (!ultimoRecordatorio || !fecha) {
    return false;
  }
  return ultimoRecordatorio.slice(0, 10) === fecha;
}