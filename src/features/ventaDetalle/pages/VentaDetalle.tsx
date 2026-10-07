import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import Load from '@/shared/components/feedback/Load';

import { salesService } from '@/features/ventas/services/salesServices';
import { Button } from '@/shared/components/ui';
import StateDetalleTransaction from '../components/StateDetalleTransaction';
import CronogramaFees from '../components/CronogramaFees';
import HeaderDetalleTransaction from '../components/HeaderDetalleTransaction';
import ClientInfoDetalle from '../components/ClientInfoDetalle';
import InfoTransactionDetalle from '../components/InfoTransactionDetalle';
import { SaleResponseDto } from '@/shared/types/sales';
import Modal from '@/shared/components/ui/Modal';
import Select from '@/shared/components/ui/Select';

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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refundOnCancel, setRefundOnCancel] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
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
      setActionError(err instanceof Error ? err.message : 'Error al eliminar la venta');
      setIsDeleteModalOpen(false);
    }
  };

  const handleOpenCancel = () => {
    setRefundOnCancel(true);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!id) return;
    try {
      const updated = await salesService.cancelSale(parseInt(id), refundOnCancel);
      setTransaction(updated);
      setActionError(null);
      setIsCancelModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al anular la venta');
    }
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
      <DashboardLayout title="Detalle" user={user} onLogout={onLogout}>
        <Load message="Cargando transacción..." />
      </DashboardLayout>
    );
  }

  if (error || !transaction) {
    return (
      <DashboardLayout title="Detalle" user={user} onLogout={onLogout}>
        <ErrorMessage message={error ||'Error en la transaccion'} />
      </DashboardLayout>
    );
  }


  const isLoan = transaction.kind === 'PRESTAMO';
  const hasPaidFees = (transaction.paidFeesCount ?? 0) > 0;
  const collectedAmount = transaction.collectedAmount ?? 0;

  return (
    <DashboardLayout title={`${isLoan ? 'Préstamo' : 'Venta'} #${transaction.id}`} user={user} onLogout={onLogout}>
      <div className="space-y-6">

        <HeaderDetalleTransaction 
          transaction={transaction} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCancel={handleOpenCancel}
          canDelete={!hasPaidFees}
        />
        
        {/* Transaction state */}
        <StateDetalleTransaction
          transaction={transaction}
          formatCurrency={formatCurrency}
        />

        {/* Botón para mostrar/ocultar detalles */}
        <div className="my-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
          </Button>
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
          formatCurrency={formatCurrency}
          refreshTransaction={refreshTransaction}
        />
        </div>
        <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Anular venta"
      >
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que quieres anular {isLoan ? 'este préstamo' : 'esta venta'}{' '}
            #{transaction.id}? El registro se conservará como anulado y se repondrá el stock
            del producto. La deuda pendiente quedará en cero.
          </p>

          {collectedAmount > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Monto ya cobrado: {formatCurrency(collectedAmount)}
              </label>
              <Select
                value={refundOnCancel ? 'refund' : 'retain'}
                onChange={(e) => setRefundOnCancel(e.target.value === 'refund')}
                className="mt-2"
                aria-label="Manejo del monto cobrado al anular"
              >
                <option value="refund">Devolver al cliente el monto cobrado</option>
                <option value="retain">Conservar el monto cobrado</option>
              </Select>
            </div>
          )}

          {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancel}
            >
              Anular
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que quieres eliminar {isLoan ? 'este préstamo' : 'esta venta'}? Esta acción no se puede deshacer.
          </p>
          {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      </DashboardLayout>
  );
};

export default VentaDetalle;