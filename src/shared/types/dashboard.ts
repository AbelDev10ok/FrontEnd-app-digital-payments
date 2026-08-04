export interface DashboardStatsDto {
  totalSales: number;
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  totalProfit: number;
  totalOverdueFees?: number;
}

export interface ClientStatsDto {
  totalActiveClients: number;
}
