import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle,
} from 'lucide-react';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { DashboardLayout } from '@/shared/components/layout';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import Load from '@/shared/components/feedback/Load';

import {salesService } from '@/features/ventas/services/salesServices';
import StateDetalleTransaction from '../components/StateDetalleTransaction';
import CronogramaFees from '../components/CronogramaFees';
import HeaderDetalleTransaction from '../components/HeaderDetalleTransaction';
import ClientInfoDetalle from '../components/ClientInfoDetalle';
import InfoTransactionDetalle from '../components/InfoTransactionDetalle';
import { SaleResponseDto } from '@/shared/types/sales';
import Modal from '@/shared/components/ui/Modal'; 

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const VentaDetalle: React.FC<PageProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<SaleResponseDto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleEdit = () => {
    navigate(`/dashboard/ventas/editar/${id}`);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      await salesService.deleteSale(parseInt(id));
      navigate('/dashboard/ventas/todas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la venta');
      setIsDeleteModalOpen(false);
    }
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
      // 'LATE': { bg: 'bg-red-100', text: 'text-red-800', label: 'Atrasada' },
      // 'POSTPONED': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pospuesta' },
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
      <DashboardLayout title="Detalle de Transacción" user={user} onLogout={onLogout}>
        <Load message="Cargando transacción..." />
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout title="Detalle de Transacción" user={user} onLogout={onLogout}>
        <ErrorMessage message={error ||'Error en la transaccion'} />
      </DashboardLayout>
    );
  }


  const isLoan = transaction.productType.name === 'PRESTAMO';

  

  return (
    <DashboardLayout title={`${isLoan ? 'Préstamo' : 'Venta'} #${transaction.id}`} user={user} onLogout={onLogout}>
      <div className="space-y-6">

        <HeaderDetalleTransaction 
          transaction={transaction} 
          isLoan={isLoan}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {/* Transaction state */}
        <StateDetalleTransaction
          transaction={transaction}
          formatCurrency={formatCurrency}
        />

        {/* Botón para mostrar/ocultar detalles */}
        <div className="my-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:bg-gray-50 text-sm font-medium"
          >
            {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
          </button>
        </div>

        {/* Detalles del Cliente y Transacción (colapsable) */}
        <div className={`${showDetails ? 'block' : 'hidden'}`}>
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
        <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      </DashboardLayout>
  );
};

export default VentaDetalle;