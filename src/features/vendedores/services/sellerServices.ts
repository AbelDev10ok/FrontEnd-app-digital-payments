import { authenticatedFetch } from "@/features/auth/services/authServices";
import { SELLERS_API_URL } from "@/shared/config/api";
import { handleResponse } from "@/shared/utils/http";
import type { SellerMetricsDto } from "@/shared/types/sellers";

export const sellerService = {
  /**
   * Métricas por vendedor del período (mes/año): cartera, operaciones,
   * vendido, cobrado y deuda, por moneda y separado ventas/préstamos.
   */
  async getSellerMetrics(year: number, month: number): Promise<SellerMetricsDto> {
    const url = new URL(`${SELLERS_API_URL}/metrics`);
    url.searchParams.append("year", year.toString());
    url.searchParams.append("month", month.toString());

    const response = await authenticatedFetch(url.toString());
    return handleResponse<SellerMetricsDto>(response);
  },
};
