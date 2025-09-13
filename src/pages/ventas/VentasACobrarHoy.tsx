import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, DollarSign, Clock, CheckCircle, X } from 'lucide-react';
import DashboardLayout from '../../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';

const VentasACobrarHoy: React.FC = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<{ id: number; amount: number; numberFee: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [remainingDebt, setRemainingDebt] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const openPaymentModal = (fee: { id: number; amount: number; numberFee: number }) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.amount.toString());
    setRemainingDebt(fee.amount);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedFee(null);
    setPaymentAmount('');
    setRemainingDebt(0);
  };

  const handlePaymentAmountChange = (value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPaymentAmount(value);
    if (selectedFee) {
      setRemainingDebt(Math.max(0, selectedFee.amount - numericValue));
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedFee || !paymentAmount) return;
    
    try {
      setProcessingFee(selectedFee.id);
      await salesService.markFeeAsPaid(selectedFee.id, parseFloat(paymentAmount));
      // Recargar datos
      await fetchSalesToday();
      closePaymentModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagada');
    } finally {
      setProcessingFee(null);
    }
  };

  const fetchSalesToday = async () => {
    try {
      setLoading(true);
      setError(null);
      // Obtener fecha local de Argentina en formato YYYY-MM-DD
      const todayDate = new Date();
      const today = todayDate.getFullYear() + '-' +
        String(todayDate.getMonth() + 1).padStart(2, '0') + '-' +
        String(todayDate.getDate()).padStart(2, '0');
      console.log("Hoy es (local Argentina): "+today);
      const salesData = await salesService.getFeesDueOn('VENTAS', today);
      setSales(salesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesToday();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Ventas a Cobrar Hoy">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando ventas...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ventas a Cobrar Hoy">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ventas a Cobrar Hoy</h2>
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
                <p className="text-sm font-medium text-gray-600">Total Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.priceTotal, 0))}
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
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.remainingAmount, 0))}
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas del Día</h3>
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay ventas para cobrar hoy</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Venta #{sale.id}</h4>
                        <p className="text-sm text-gray-600">{sale.client.name}</p>
                        <p className="text-sm text-gray-500">{sale.descriptionProduct}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(sale.priceTotal)}</p>
                        <p className="text-sm text-orange-600">Pendiente: {formatCurrency(sale.remainingAmount)}</p>
                      </div>
                    </div>
                    
                    {/* Cuotas pendientes */}
                    {sale.fees && sale.fees.length > 0 && (
                      <div className="space-y-2">
                        {sale.fees.filter(fee => !fee.paid).map((fee) => (
                          <div key={fee.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="text-sm font-medium">Cuota {fee.numberFee}</span>
                              <span className="text-sm text-gray-500 ml-2">{formatDate(fee.expirationDate)}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{formatCurrency(fee.amount)}</span>
                              <button
                                onClick={() => openPaymentModal({ id: fee.id, amount: fee.amount, numberFee: fee.numberFee })}
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

        {/* Payment Modal */}
        {showPaymentModal && selectedFee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pagar Cuota #{selectedFee.numberFee}
                </h3>
                <button
                  onClick={closePaymentModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Monto total de la cuota:</span>
                    <span className="font-medium">{formatCurrency(selectedFee.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deuda restante:</span>
                    <span className={`font-medium ${remainingDebt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(remainingDebt)}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a pagar *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                    <input
                      type="number"
                      id="paymentAmount"
                      value={paymentAmount}
                      onChange={(e) => handlePaymentAmountChange(e.target.value)}
                      min="0"
                      max={selectedFee.amount}
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  {parseFloat(paymentAmount) > selectedFee.amount && (
                    <p className="mt-1 text-sm text-red-600">
                      El monto no puede ser mayor al total de la cuota
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closePaymentModal}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedFee.amount || processingFee === selectedFee.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingFee === selectedFee.id ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Procesando...
                      </div>
                    ) : (
                      'Confirmar Pago'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VentasACobrarHoy;