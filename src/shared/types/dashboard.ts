export interface DashboardStatsDto {
  year: number;
  month: number;
  resumen: DashboardResumen;
  anual: DashboardAnual;
  serie12Meses: MonthlySales[];
  topClientes: TopClient[];
  porTipoProducto: ProductTypeSales[];
  clientes: DashboardClientes;
}

export interface DashboardResumen {
  totalVentas: number;
  totalVendido: number;
  totalCobrado: number;
  pendientePorCobrar: number;
  ganancia: number;
  reembolsos: number;
  completadas: number;
  pendientes: number;
  canceladas: number;
  cuotasVencidas: { cantidad: number; monto: number };
}

export interface DashboardAnual {
  totalVentas: number;
  totalVendido: number;
  totalCobrado: number;
  ganancia: number;
}

export interface MonthlySales {
  year: number;
  month: number;
  vendido: number;
  cobrado: number;
  ganancia: number;
}

export interface TopClient {
  clientId: number;
  clientName: string;
  totalVentas: number;
  totalVendido: number;
  totalCobrado: number;
}

export interface ProductTypeSales {
  tipo: string;
  totalVentas: number;
  totalVendido: number;
}

export interface DashboardClientes {
  totalClientes: number;
  activos: number;
}
