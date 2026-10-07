// Tipos del negocio (tenant) y de la agenda de cobros / cuotas globales.

export type PlanStatus = "TRIAL" | "ACTIVE";

export interface BusinessMe {
  id: number;
  name: string;
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
  fechaVencimiento: string;
  pagada: boolean;
  fechaPago?: string | null;
  paymentMethod?: string | null;
  diasAtraso: number;
  estado: CuotaEstado;
}

export type CuotaEstadoFiltro = "PENDING" | "TODAY" | "DELAYED" | "UPCOMING" | "PAID";

export type SaleKindParam = "VENTA" | "PRESTAMO";

export interface CobrosResumen {
  cantidad: number;
  monto: number;
}

export interface CobrosHoyResponse {
  hoy: CobrosResumen;
  vencidas: CobrosResumen;
  items: CuotaItem[];
  fecha: string;
}
