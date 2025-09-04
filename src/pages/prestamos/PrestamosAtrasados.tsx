import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, AlertCircle, DollarSign, Clock, User, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';

const PrestamosAtrasados: React.FC = () => {
  const [loans, setLoans] = useState<SaleResponseDto[]>([]);
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

  const fetchOverdueLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const allLoans = await salesService.getFeesDueOn('PRESTAMO', today);
      const overdueLoans = allLoans.filter(loan => loan.daysLate > 0);
      setLoans(overdueLoans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los préstamos atrasados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueLoans();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Préstamos Atrasados">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando préstamos atrasados...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Préstamos Atrasados">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Préstamos Atrasados</h2>
            <p className="text-sm text-gray-500">Préstamos con pagos vencidos</p>
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
                <p className="text-sm font-medium text-gray-600">Préstamos Atrasados</p>
                <p className="text-2xl font-bold text-red-600">{loans.length}</p>
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
                  {formatCurrency(loans.reduce((sum, loan) => sum + loan.remainingAmount, 0))}
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
                  {loans.length > 0 ? Math.round(loans.reduce((sum, loan) => sum + loan.daysLate, 0) / loans.length) : 0}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Loans List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Préstamos Atrasados</h3>
            {loans.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">¡Excelente! No hay préstamos atrasados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <div key={loan.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Préstamo #{loan.id}</h4>
                          <p className="text-sm text-gray-600">{loan.client.name}</p>
                          <p className="text-sm text-gray-500">{loan.descriptionProduct}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(loan.priceTotal)}</p>
                        <p className="text-sm text-red-600">Atraso: {loan.daysLate} días</p>
                        <p className="text-sm text-orange-600">Pendiente: {formatCurrency(loan.remainingAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-red-200">
                      <span className="text-sm text-gray-600">
                        Fecha préstamo: {formatDate(loan.dateSale)}
                      </span>
                      <Link
                        to={`/dashboard/ventas/${loan.id}`}
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

export default PrestamosAtrasados;