import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService, SaleResponseDto } from '../../services/salesServices';
import CronogramaFees from './CronogramaFees';
import StateDetalleTransaction from './StateDetalleTransaction';
import { formatCurrency } from '../../utils/formatCurrency';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { Load } from '@/shared';
import ClientInfoDetalle from './ClientInfoDetalle';
import HeaderDetalleTransaction from './HeaderDetalleTransaction';
import InfoTransactionDetalle from './InfoTransactionDetalle';

const VentaDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<SaleResponseDto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use shared formatCurrency util (defaults to ARS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'UTC',
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

  const refreshTransaction = async () => {
    if (!transaction) return;
    const updated = await salesService.getSaleById(transaction.id);
    setTransaction(updated);
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
            refreshTransaction={refreshTransaction}
        />
        </div>
      </DashboardLayout>
  );
};

export default VentaDetalle;