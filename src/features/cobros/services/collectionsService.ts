import { authenticatedFetch } from "@/features/auth/services/authServices";
import { handleResponse } from "@/shared/utils/http";
import { LOANS_API_URL } from "@/shared/config/api";
import type {
  CobrosHoyResponse,
  CuotaEstadoFiltro,
  CuotaItem,
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
};
