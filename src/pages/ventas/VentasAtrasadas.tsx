import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, AlertCircle, DollarSign, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';

const VentasAtrasadas: React.FC = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const fetchOverdueSales = async () => {
    try {
      setLoading(true);
      setError(null);
      // Aquí necesitarías un endpoint específico para ventas atrasadas
      // Por ahora usamos el endpoint general y filtramos
      const today = new Date().toISOString().split('T')[0];
      const allSales = await salesService.getFeesDueOn('VENTAS', today);
      const overdueSales = allSales.filter(sale => sale.daysLate > 0);
      setSales(overdueSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas atrasadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueSales();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Ventas Atrasadas">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando ventas atrasadas...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ventas Atrasadas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ventas Atrasadas</h2>
            <p className="text-sm text-gray-500">Ventas con pagos vencidos</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{sales.length}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto en Atraso</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días Promedio Atraso</p>
                <p className="text-2xl font-bold text-red-600">
                  {sales.length > 0 ? Math.round(sales.reduce((sum, sale) => sum + sale.daysLate, 0) / sales.length) : 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Sales List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Ventas Atrasadas</h3>
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">¡Excelente! No hay ventas atrasadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Venta #{sale.id}</h4>
                          <p className="text-sm text-gray-600">{sale.client.name}</p>
                          <p className="text-sm text-gray-500">{sale.descriptionProduct}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(sale.priceTotal)}</p>
                        <p className="text-sm text-red-600">Atraso: {sale.daysLate} días</p>
                        <p className="text-sm text-orange-600">Pendiente: {formatCurrency(sale.remainingAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-red-200">
                      <span className="text-sm text-gray-600">
                        Fecha venta: {formatDate(sale.dateSale)}
                      </span>
                      <Link
                        to={`/dashboard/ventas/${sale.id}`}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Ver Detalle
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VentasAtrasadas;