import type { MontosPorMoneda } from "@/shared/types/money";

export interface DashboardStatsDto {
  year: number;
  month: number;
  /** Monedas (ISO 4217) presentes en los datos: alimentan el selector de moneda */
  monedasDisponibles: string[];
  resumen: DashboardResumen;
  anual: DashboardAnual;
  serie12Meses: MonthlySales[];
  topClientes: TopClient[];
  porTipoProducto: ProductTypeSales[];
  clientes: DashboardClientes;
}

export interface DashboardResumen {
  totalVentas: number;
  /** Montos por moneda: las monedas distintas nunca se suman entre sí */
  totalVendido: MontosPorMoneda;
  totalCobrado: MontosPorMoneda;
  /** Deuda de las ventas activas creadas en el mes consultado (no es la deuda total) */
  pendienteDelMes: MontosPorMoneda;
  /** Deuda total de las ventas activas a hoy: no depende del mes consultado */
  deudaTotal: MontosPorMoneda;
  ganancia: MontosPorMoneda;
  reembolsos: MontosPorMoneda;
  completadas: number;
  pendientes: number;
  canceladas: number;
  cuotasVencidas: { cantidad: number; monto: MontosPorMoneda };
}

export interface DashboardAnual {
  totalVentas: number;
  totalVendido: MontosPorMoneda;
  totalCobrado: MontosPorMoneda;
  ganancia: MontosPorMoneda;
}

export interface MonthlySales {
  year: number;
  month: number;
  vendido: MontosPorMoneda;
  cobrado: MontosPorMoneda;
  ganancia: MontosPorMoneda;
}

export interface TopClient {
  clientId: number;
  clientName: string;
  totalVentas: number;
  totalVendido: MontosPorMoneda;
  totalCobrado: MontosPorMoneda;
}

export interface ProductTypeSales {
  tipo: string;
  totalVentas: number;
  totalVendido: MontosPorMoneda;
}

export interface DashboardClientes {
  totalClientes: number;
  activos: number;
}
