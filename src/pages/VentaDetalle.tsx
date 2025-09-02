import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../components/DashBoardLayout';
import { salesService, SaleResponseDto } from '../services/salesServices';

const VentaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<SaleResponseDto | null>(null);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'LATE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'POSTPONED':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PAID': { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagada' },
      'LATE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Atrasada' },
      'POSTPONED': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pospuesta' },
      'PENDING': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleMarkAsPaid = async (feeId: number) => {
    if (!transaction) return;
    
    try {
      setProcessingFee(feeId);
      await salesService.markFeeAsPaid(transaction.id, feeId);
      
      // Recargar los datos de la transacción
      const updatedTransaction = await salesService.getSaleById(transaction.id);
      setTransaction(updatedTransaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar la cuota como pagada');
    } finally {
      setProcessingFee(null);
    }
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const transactionData = await salesService.getSaleById(parseInt(id));
        setTransaction(transactionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la transacción');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Detalle de Transacción">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-gray-600">Cargando información de la transacción...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout title="Detalle de Transacción">
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Link
              to="/dashboard/ventas"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error || 'Transacción no encontrada'}</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isLoan = transaction.productType.name === 'PRESTAMO';

  return (
    <DashboardLayout title={`${isLoan ? 'Préstamo' : 'Venta'} #${transaction.id}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/ventas"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {isLoan ? 'Préstamo' : 'Venta'} #{transaction.id}
            </h2>
            <p className="text-sm text-gray-500">{transaction.descriptionProduct}</p>
          </div>
        </div>

        {/* Transaction Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.priceTotal)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(transaction.remainingAmount)}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuotas Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{transaction.paidFeesCount}/{transaction.totalFees}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días de Atraso</p>
                <p className={`text-2xl font-bold ${transaction.daysLate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.daysLate}
                </p>
              </div>
              <div className={`${transaction.daysLate > 0 ? 'bg-red-50' : 'bg-green-50'} p-3 rounded-xl`}>
                <Clock className={`w-6 h-6 ${transaction.daysLate > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Client and Transaction Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Cliente</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">{transaction.client.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-medium text-gray-900">{transaction.client.dni}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{transaction.client.telefono}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Transacción</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de {isLoan ? 'Préstamo' : 'Venta'}</p>
                  <p className="font-medium text-gray-900">{formatDate(transaction.dateSale)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha Final de Pago</p>
                  <p className="font-medium text-gray-900">{formatDate(transaction.finalPaymentDate)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Pago</p>
                  <p className="font-medium text-gray-900">
                    {transaction.typePayments === 'CASH' ? 'Pago Único' : 'Cuotas'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fees Section */}
        {transaction.typePayments === 'INSTALLMENTS' && transaction.fees.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cronograma de Cuotas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cuota
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transaction.fees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(fee.status)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            Cuota {fee.numberFee}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(fee.amount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(fee.expirationDate)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(fee.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {!fee.paid && (
                          <button
                            onClick={() => handleMarkAsPaid(fee.id)}
                            disabled={processingFee === fee.id}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                          >
                            {processingFee === fee.id ? (
                              <Loader2 className="w-4 h-4 animate-spin inline" />
                            ) : (
                              'Marcar como Pagada'
                            )}
                          </button>
                        )}
                        {fee.paid && fee.paymentDate && (
                          <span className="text-green-600 text-sm">
                            Pagada el {formatDate(fee.paymentDate)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {transaction.typePayments === 'INSTALLMENTS' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso de Pago</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progreso: {transaction.paidFeesCount} de {transaction.totalFees} cuotas</span>
                <span>{Math.round((transaction.paidFeesCount / transaction.totalFees) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(transaction.paidFeesCount / transaction.totalFees) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">
                  Pagado: {formatCurrency(transaction.priceTotal - transaction.remainingAmount)}
                </span>
                <span className="text-orange-600 font-medium">
                  Pendiente: {formatCurrency(transaction.remainingAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-3" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VentaDetalle;