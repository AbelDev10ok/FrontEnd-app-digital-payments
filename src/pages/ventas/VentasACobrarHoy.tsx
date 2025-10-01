import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, DollarSign, Clock, CheckCircle} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';
import { ModalPay } from '../../components/pay/ModalPay';

const VentasACobrarHoy: React.FC = () => {
  const [sales, setSales] = useState<SaleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<{ id: number; amount: number; numberFee: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [remainingDebt, setRemainingDebt] = useState(0);

  // mostras un console log del valor de fee.amount cuando se abre el modal de pago
  // para verificar que no sea null o undefined
  // y si lo es, manejar el error adecuadamente
  console.log("selectedFee amount:", sales);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const openPaymentModal = (fee: { id: number; amount: number; numberFee: number }, remainingDebt: number) => {
      const str = fee.amount != null ? fee.amount.toString() : '';
      console.log(fee.amount)
    setSelectedFee(fee);
    setPaymentAmount(str);
    setRemainingDebt(remainingDebt);
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
                                onClick={() => openPaymentModal({ id: fee.id, amount: sale.amountFe , numberFee: fee.numberFee },sale.remainingAmount)}
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
          <ModalPay 
            open={showPaymentModal}
            onClose={closePaymentModal}
            selectedFee={selectedFee}
            paymentAmount={paymentAmount}
            onPaymentAmountChange={handlePaymentAmountChange}
            remainingDebt={remainingDebt}
            onConfirm={handleConfirmPayment}
            processingFeeId={processingFee}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default VentasACobrarHoy;