import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, DollarSign, Clock, CheckCircle, CreditCard, User } from 'lucide-react';
import DashboardLayout from '../../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';

const PrestamosACobrarHoy: React.FC = () => {
  const [loans, setLoans] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const handleMarkAsPaid = async (saleId: number, feeId: number) => {
    try {
      setProcessingFee(feeId);
      await salesService.markFeeAsPaid(saleId, feeId);
      // Recargar datos
      await fetchLoansToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagada');
    } finally {
      setProcessingFee(null);
    }
  };

  const fetchLoansToday = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const loansData = await salesService.getFeesDueOn('PRESTAMO', today);
      setLoans(loansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoansToday();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Préstamos a Cobrar Hoy">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando préstamos...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Préstamos a Cobrar Hoy">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Préstamos a Cobrar Hoy</h2>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('es-ES')}</p>
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
                <p className="text-sm font-medium text-gray-600">Préstamos Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(loans.reduce((sum, loan) => sum + loan.priceTotal, 0))}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendiente Cobro</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(loans.reduce((sum, loan) => sum + loan.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Préstamos del Día</h3>
            {loans.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay préstamos para cobrar hoy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <div key={loan.id} className="border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 bg-blue-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Préstamo #{loan.id}</h4>
                          <p className="text-sm text-gray-600">{loan.client.name}</p>
                          <p className="text-sm text-gray-500">{loan.descriptionProduct}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(loan.priceTotal)}</p>
                        <p className="text-sm text-orange-600">Pendiente: {formatCurrency(loan.remainingAmount)}</p>
                      </div>
                    </div>
                    
                    {/* Cuotas pendientes */}
                    {loan.fees && loan.fees.length > 0 && (
                      <div className="space-y-2">
                        {loan.fees.filter(fee => !fee.paid).map((fee) => (
                          <div key={fee.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-200">
                            <div>
                              <span className="text-sm font-medium">Cuota {fee.numberFee}</span>
                              <span className="text-sm text-gray-500 ml-2">{formatDate(fee.expirationDate)}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{formatCurrency(fee.amount)}</span>
                              <button
                                onClick={() => handleMarkAsPaid(loan.id, fee.id)}
                                disabled={processingFee === fee.id}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {processingFee === fee.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default PrestamosACobrarHoy;