import { useState, useEffect } from 'react';
import { salesService, SaleResponseDto } from '../services/salesServices';

export const useSales = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    completedSales: 0,
    pendingSales: 0,
    totalRevenue: 0,
    totalOutstanding: 0,
  });

  const fetchSalesToChargeToday = async () => {
    try {
      setLoading(true);
      setError(null);
      // fecha en formato año-mes-día
      const today = new Date().toISOString().split('T')[0];
      console.log('Today:', today);
      
      // Obtener ventas y préstamos en paralelo
      const [salesData] = await Promise.all([
        salesService.getFeesDueOn('VENTAS',today),
      ]);
      console.log('Sales Data:', salesData);
      setSales(salesData);
      // setLoans(loansData);
      
      // Calcular estadísticas localmente
      calculateStats(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: SaleResponseDto[]) => {
    const allTransactions = [...salesData];
    
    const totalSales = salesData.length;
    const completedSales = allTransactions.filter(t => t.completed).length;
    const pendingSales = allTransactions.filter(t => !t.completed).length;
    const totalRevenue = allTransactions
      .filter(t => t.completed)
      .reduce((sum, t) => sum + t.priceTotal, 0);
    const totalOutstanding = allTransactions
      .filter(t => !t.completed)
      .reduce((sum, t) => sum + t.remainingAmount, 0);

    setStats({
      totalSales,
      completedSales,
      pendingSales,
      totalRevenue,
      totalOutstanding,
    });
  };

  const markFeeAsPaid = async (saleId: number, feeId: number) => {
    try {
      await salesService.markFeeAsPaid(saleId, feeId);
      // Refrescar datos después de marcar como pagada
      await fetchSalesToChargeToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar la cuota como pagada');
      throw err;
    }
  };

  const postponeFee = async (saleId: number, feeId: number, newDate: string) => {
    try {
      await salesService.postponeFee(saleId, feeId, newDate);
      // Refrescar datos después de posponer
      await fetchSalesToChargeToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al posponer la cuota');
      throw err;
    }
  };

  const deleteSale = async (id: number) => {
    try {
      await salesService.deleteSale(id);
      // Actualizar estado local
      setSales(prev => prev.filter(sale => sale.id !== id));
      // Recalcular estadísticas
      const updatedSales = sales.filter(sale => sale.id !== id);
      calculateStats(updatedSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la transacción');
      throw err;
    }
  };

  useEffect(() => {
    fetchSalesToChargeToday();
  }, []);

  return {
    sales,
    allTransactions: [...sales],
    loading,
    error,
    stats,
    fetchSalesToChargeToday,
    markFeeAsPaid,
    postponeFee,
    deleteSale,
  };
};