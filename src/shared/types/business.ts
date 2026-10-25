// Tipos del negocio (tenant) y de la agenda de cobros / cuotas globales.

export type PlanStatus = "TRIAL" | "ACTIVE" | "PAUSED" | "CANCELLED" | "BLOCKED";

import type { MontosPorMoneda } from "@/shared/types/money";

export interface BusinessMe {
  id: number;
  name: string;
  /** CUIT de 11 dígitos (opcional). Se imprime en los remitos. */
  cuit?: string | null;
  /** Dirección del negocio (opcional). Se imprime en los remitos. */
  address?: string | null;
  /** Teléfono del negocio (opcional). Se imprime en los remitos. */
  phone?: string | null;
  currency: string;
  defaultInterestRate?: number | null;
  defaultPaymentFrequency?: string | null;
  planStatus: PlanStatus;
  trialEndsAt?: string | null;
  subscriptionUntil?: string | null;
  createdAt?: string | null;
}

export interface BusinessUpdateRequest {
  name: string;
  /** Vacío ("") borra el dato; ausente lo deja como está. */
  cuit?: string;
  /** Vacío ("") borra el dato; ausente lo deja como está. */
  address?: string;
  /** Vacío ("") borra el dato; ausente lo deja como está. */
  phone?: string;
  currency?: string;
  defaultInterestRate?: number | null;
  defaultPaymentFrequency?: string;
}

export type CuotaEstado = "TODAY" | "DELAYED" | "UPCOMING" | "PAID";

export interface CuotaItem {
  id: number;
  saleId: number;
  clientId: number;
  clientName: string;
  clientPhone?: string | null;
  saleDescription?: string | null;
  saleKind?: SaleKindParam | null;
  numeroCuota: number;
  totalCuotas?: number | null;
  monto?: number | null;
  /** Deuda restante de la venta: tope real de lo que se puede cobrar en la cuota */
  deudaVenta?: number | null;
  fechaVencimiento: string;
  pagada: boolean;
  fechaPago?: string | null;
  /** Fecha y hora del último cobro de la cuota */
  fechaPagoHora?: string | null;
  paymentMethod?: string | null;
  diasAtraso: number;
  estado: CuotaEstado;
  /** Moneda ISO 4217 heredada de la venta (snapshot de la transacción) */
  currency?: string | null;
}

export type CuotaEstadoFiltro = "PENDING" | "TODAY" | "DELAYED" | "UPCOMING" | "PAID";

export type SaleKindParam = "VENTA" | "PRESTAMO";

export interface CobrosResumen {
  cantidad: number;
  /** Montos por moneda: las monedas distintas nunca se suman entre sí */
  monto: MontosPorMoneda;
}

export interface CobrosHoyResponse {
  hoy: CobrosResumen;
  vencidas: CobrosResumen;
  items: CuotaItem[];
  fecha: string;
}
