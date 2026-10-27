import type { MontosPorMoneda } from "@/shared/types/money";
import type { SaleKind } from "@/shared/types/sales";

/**
 * Métricas de un vendedor en el período consultado, más su cartera actual.
 *
 * "Vendido" y "cobrado" son su actividad (el sello de cada operación);
 * "deuda" es la cobranza de su cartera actual, que puede incluir operaciones
 * vendidas por otro. `sellerId: null` es la fila "Sin vendedor".
 */
export interface SellerMetricDto {
  sellerId: number | null;
  sellerName: string;
  /** ¿Sigue habilitado como vendedor hoy? Los deshabilitados conservan su historial. */
  activo: boolean;
  /** Clientes asignados hoy (cartera actual). */
  clientesCartera: number;
  /** Operaciones creadas en el período (incluye las luego anuladas). */
  operaciones: Record<SaleKind, number>;
  /** De esas, las que hoy están anuladas. */
  anuladas: Record<SaleKind, number>;
  /** Monto vendido en el período, por tipo y moneda. */
  vendido: Record<SaleKind, MontosPorMoneda>;
  /** Cobrado en el período por fecha de cobro, por tipo y moneda. */
  cobrado: Record<SaleKind, MontosPorMoneda>;
  /** Deuda de su cartera a hoy (operaciones activas de sus clientes). */
  deuda: Record<SaleKind, MontosPorMoneda>;
}

export interface SellerMetricsDto {
  year: number;
  month: number;
  /** Monedas presentes en los datos: alimentan el selector de moneda. */
  monedasDisponibles: string[];
  vendedores: SellerMetricDto[];
  sinVendedor: SellerMetricDto;
}
