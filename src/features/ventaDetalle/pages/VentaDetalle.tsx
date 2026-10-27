import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import RemitoEmitModal from '@/features/ventas/components/RemitoEmitModal';
import CancelSaleModal from '@/features/ventas/components/CancelSaleModal';
import DeleteSaleModal from '@/features/ventas/components/DeleteSaleModal';
import { SaleDocumentDto, SaleResponseDto } from '@/shared/types/sales';

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
  const [isRemitoModalOpen, setIsRemitoModalOpen] = useState(false);
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

  const handleDeleted = () => {
    setIsDeleteModalOpen(false);
    navigate('/dashboard/ventas/todas');
  };

  const handleOpenCancel = () => {
    setIsCancelModalOpen(true);
  };

  const handleCanceled = (actualizada: SaleResponseDto) => {
    setTransaction(actualizada);
    setIsCancelModalOpen(false);
  };

  const handleOpenRemito = () => {
    if (!transaction) return;
    if (transaction.remito) {
      window.open(
        `/dashboard/ventas/${transaction.id}/remito`,
        '_blank',
        'noopener',
      );
      return;
    }
    setIsRemitoModalOpen(true);
  };

  const handleRemitoEmitted = (
    document: SaleDocumentDto,
    printWindow: Window | null,
  ) => {
    setTransaction((prev) =>
      prev
        ? {
            ...prev,
            remito: {
              id: document.id,
              number: document.number,
              numberLabel: document.numberLabel,
              issuedAt: document.issuedAt,
            },
          }
        : prev,
    );
    setIsRemitoModalOpen(false);

    const url = `/dashboard/ventas/${document.saleId}/remito`;
    if (printWindow) {
      printWindow.location.href = url;
    } else {
      // Si el navegador bloqueó la pestaña, la abrimos en la misma ventana.
      window.location.assign(url);
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
  // Eliminar solo aplica si nunca entro dinero (ni cobros parciales): el
  // backend rechaza borrar cualquier venta con pagos registrados.
  const sinCobros = (transaction.collectedAmount ?? 0) === 0;

  return (
    <DashboardLayout title={`${isLoan ? 'Préstamo' : 'Venta'} #${transaction.id}`} user={user} onLogout={onLogout}>
      <div className="space-y-6">

        <HeaderDetalleTransaction 
          transaction={transaction} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCancel={handleOpenCancel}
          onPrintRemito={handleOpenRemito}
          canDelete={sinCobros}
        />
        
        {/* Transaction state */}
        <StateDetalleTransaction
          transaction={transaction}
          formatCurrency={(amount) => formatCurrency(amount, transaction.currency ?? undefined)}
          showDetails={showDetails}
        />

        {/* Botón para mostrar/ocultar detalles */}
        <div className="my-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
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
          formatCurrency={(amount) => formatCurrency(amount, transaction.currency ?? undefined)}
          refreshTransaction={refreshTransaction}
        />
        </div>

      <CancelSaleModal
        isOpen={isCancelModalOpen}
        sale={transaction}
        onClose={() => setIsCancelModalOpen(false)}
        onCanceled={handleCanceled}
      />

      <DeleteSaleModal
        isOpen={isDeleteModalOpen}
        sale={transaction}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={handleDeleted}
      />

      <RemitoEmitModal
        isOpen={isRemitoModalOpen}
        sale={transaction}
        onClose={() => setIsRemitoModalOpen(false)}
        onEmitted={handleRemitoEmitted}
      />

      </DashboardLayout>
  );
};

export default VentaDetalle;