import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '../components/dashboard/DashBoardLayout';
import { salesService, SaleResponseDto } from '../services/salesServices';
import CronogramaFees from '../shared/CronogramaFees';
import Load from '../shared/Load';
import HeaderDetalleTransaction from '../shared/HeaderDetalleTransaction';
import StateDetalleTransaction from '../shared/StateDetalleTransaction';
import ClientInfoDetalle from '../shared/ClientInfoDetalle';
import InfoTransactionDetalle from '../shared/InfoTransactionDetalle';
import ErrorMessage from '../shared/ErrorMessage';

const VentaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<SaleResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        <Load message="Cargando transacción..." />
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout title="Detalle de Transacción">
        {/* <div className="space-y-6">
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
        </div> */}
        <ErrorMessage message={error ||'Error en la transaccion'} />
      </DashboardLayout>
    );
  }

  const isLoan = transaction.productType.name === 'PRESTAMO';

  return (
    <DashboardLayout title={`${isLoan ? 'Préstamo' : 'Venta'} #${transaction.id}`}>
      <div className="space-y-6">

        <HeaderDetalleTransaction transaction={transaction} isLoan={isLoan} />
        
        {/* Transaction state */}
        <StateDetalleTransaction
          transaction={transaction}
          formatCurrency={formatCurrency}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
          {/* Client Info */}
          <ClientInfoDetalle transaction={transaction} />
        
          {/* Transaction Info */}
          <InfoTransactionDetalle
            transaction={transaction}
            isLoan={isLoan}
            formatDate={formatDate}
          />
        </div>

        <CronogramaFees
            transaction={transaction}
            formatDate={formatDate}
            getStatusIcon={getStatusIcon}
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
            handleMarkAsPaid={handleMarkAsPaid}
            processingFee={processingFee}
        />
        </div>
      </DashboardLayout>
  );
};

export default VentaDetalle;