import { authenticatedFetch } from "@/features/auth/services/authServices";
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

export const collectionsService = {
  /** Agenda de cobros del dia: cuotas que vencen hoy + vencidas, con resumen. */
  async getCobrosHoy(fecha?: string): Promise<CobrosHoyResponse> {
    const url = fecha
      ? `${LOANS_API_URL}/collections/today?date=${fecha}`
      : `${LOANS_API_URL}/collections/today`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
      throw new Error("Error al cargar los cobros del día");
    }
    return response.json();
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
