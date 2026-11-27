import { authenticatedFetch } from "@/features/auth/services/authServices";
import { handleResponse } from "@/shared/utils/http";
import { LOANS_API_URL } from "@/shared/config/api";
import type {
  CobrosHoyResponse,
  CuotaEstadoFiltro,
  CuotaItem,
  PaymentPromise,
  RoundResponse,
} from "@/shared/types/business";
import type { Page } from "@/features/ventas/services/salesServices";

export interface CuotasFilters {
  page: number;
  size: number;
  estado?: CuotaEstadoFiltro;
  desde?: string;
  hasta?: string;
  clientId?: number;
}

export interface CobrosHoyFilters {
  fecha?: string;
  /** Cartera del cliente: quien lo atiende es quien cobra, no la autoría de la venta */
  sellerId?: number;
}

/** Marca de gestión que devuelve registrar un recordatorio de pago. */
export interface RecordatorioResponse {
  feeId: number;
  /** Fecha y hora local del recordatorio (`YYYY-MM-DDTHH:mm:ss`). */
  ultimoRecordatorio: string;
  recordatorios: number;
}

/** Detalle del cobro aplicado sobre una operación del cliente. */
export interface ClientPaymentApplication {
  saleId: number;
  saleDescription?: string | null;
  saleKind?: string | null;
  appliedAmount: number;
  saleRemainingAmount: number;
  feesPaid: number;
  saleCompleted: boolean;
}

/** Resultado del cobro por cliente: un monto distribuido entre sus operaciones. */
export interface ClientPaymentResult {
  clientId: number;
  clientName: string;
  currency: string;
  appliedAmount: number;
  remainingDebt: number;
  applications: ClientPaymentApplication[];
}

/** Parámetros del cobro por cliente. */
export interface ClientPaymentParams {
  amount: number;
  /** Fecha del cobro (`YYYY-MM-DD`). */
  date: string;
  /** Moneda ISO 4217 del grupo que se está cobrando. */
  currency: string;
  /** Método de pago (`EFECTIVO` por defecto). */
  paymentMethod?: string;
}

/** Alta de una promesa de pago: cliente + moneda + monto + fecha. */
export interface PaymentPromiseParams {
  /** Moneda ISO 4217 del grupo (el compromiso nunca cruza monedas). */
  currency: string;
  amount: number;
  /** Fecha prometida (`YYYY-MM-DD`). */
  promisedDate: string;
  note?: string;
}

export const collectionsService = {
  /** Agenda de cobros: cuotas que vencen hasta la fecha (hoy por defecto) + vencidas, con resumen. */
  async getCobrosHoy(filters: CobrosHoyFilters = {}): Promise<CobrosHoyResponse> {
    const params = new URLSearchParams();
    if (filters.fecha) params.append("date", filters.fecha);
    if (filters.sellerId) params.append("sellerId", filters.sellerId.toString());
    const query = params.toString();
    const response = await authenticatedFetch(
      `${LOANS_API_URL}/collections/today${query ? `?${query}` : ""}`,
    );
    if (!response.ok) {
      throw new Error("Error al cargar los cobros del día");
    }
    return response.json();
  },

  /**
   * Registra que se le recordó la cuota al cliente por WhatsApp (el envío es
   * manual). La agenda usa la marca para no repetir el reclamo el mismo día.
   */
  async marcarRecordatorio(feeId: number): Promise<RecordatorioResponse> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/fee/${feeId}/reminder`, {
      method: "POST",
    });
    return handleResponse<RecordatorioResponse>(response);
  },

  /**
   * Registra un cobro por cliente: el monto se distribuye entre sus
   * operaciones con deuda en esa moneda, de la cuota impaga más antigua a la
   * más nueva. Las monedas nunca se mezclan: siempre es un cobro por moneda.
   */
  async payClient(clientId: number, params: ClientPaymentParams): Promise<ClientPaymentResult> {
    const search = new URLSearchParams();
    search.append("amount", params.amount.toString());
    search.append("date", params.date);
    search.append("currency", params.currency);
    search.append("paymentMethod", params.paymentMethod ?? "EFECTIVO");
    const response = await authenticatedFetch(
      `${LOANS_API_URL}/clients/${clientId}/pay?${search.toString()}`,
      { method: "POST" },
    );
    return handleResponse<ClientPaymentResult>(response);
  },

  /** Vista global de cuotas con filtros combinables (paginada). */
  async getCuotas(filters: CuotasFilters): Promise<Page<CuotaItem>> {
    const params = new URLSearchParams();
    params.append("page", filters.page.toString());
    params.append("size", filters.size.toString());
    if (filters.estado) params.append("status", filters.estado);
    if (filters.desde) params.append("from", filters.desde);
    if (filters.hasta) params.append("to", filters.hasta);
    if (filters.clientId) params.append("clientId", filters.clientId.toString());

    const response = await authenticatedFetch(`${LOANS_API_URL}/fees?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Error al cargar las cuotas");
    }
    return response.json();
  },

  /**
   * Registra una promesa de pago: el cliente se compromete a pagar un monto de
   * su deuda en una fecha. No mueve plata ni cuotas; es una gestión comercial.
   */
  async createPromise(clientId: number, params: PaymentPromiseParams): Promise<PaymentPromise> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/clients/${clientId}/promises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return handleResponse<PaymentPromise>(response);
  },

  /** Cancela una promesa pendiente (el cliente no la sostiene o se renegoció). */
  async cancelPromise(promiseId: number): Promise<PaymentPromise> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/promises/${promiseId}/cancel`, {
      method: "POST",
    });
    return handleResponse<PaymentPromise>(response);
  },

  /** Marca como cumplida una promesa pendiente (cobro registrado fuera del flujo). */
  async fulfillPromise(promiseId: number): Promise<PaymentPromise> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/promises/${promiseId}/fulfill`, {
      method: "POST",
    });
    return handleResponse<PaymentPromise>(response);
  },

  /** Historial de promesas del cliente, opcionalmente acotado a una moneda. */
  async getPromises(clientId: number, currency?: string): Promise<PaymentPromise[]> {
    const params = new URLSearchParams();
    if (currency) params.append("currency", currency);
    const query = params.toString();
    const response = await authenticatedFetch(
      `${LOANS_API_URL}/clients/${clientId}/promises${query ? `?${query}` : ""}`,
    );
    if (!response.ok) {
      throw new Error("Error al cargar las promesas de pago");
    }
    return response.json();
  },

  /**
   * Ronda del día: el plan ordenado por riesgo que arma el backend una vez por
   * día (job de las 6). Si todavía no existe, se arma en esta consulta.
   */
  async getRound(date?: string): Promise<RoundResponse> {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    const query = params.toString();
    const response = await authenticatedFetch(
      `${LOANS_API_URL}/round/today${query ? `?${query}` : ""}`,
    );
    return handleResponse<RoundResponse>(response);
  },

  /**
   * Marca la visita de una parada de la ronda: el cliente no estaba o se le
   * dejó una nota. Devuelve la ronda completa con el estado recalculado.
   */
  async marcarVisitaRonda(
    itemId: number,
    params: { noEstaba: boolean; note?: string },
  ): Promise<RoundResponse> {
    const response = await authenticatedFetch(`${LOANS_API_URL}/round/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return handleResponse<RoundResponse>(response);
  },
};
