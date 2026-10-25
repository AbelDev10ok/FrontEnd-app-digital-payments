import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Select from '@/shared/components/ui/Select';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleResponseDto } from '@/shared/types/sales';

interface CancelSaleModalProps {
  isOpen: boolean;
  sale: SaleResponseDto | null;
  onClose: () => void;
  /** Recibe la venta ya anulada (la conserva el historial). */
  onCanceled: (sale: SaleResponseDto) => void;
}

/**
 * Anulación de una venta o préstamo, compartida por el listado y el detalle.
 * Si ya hubo cobros, deja elegir si se devuelven al cliente o los retiene el
 * negocio; los remitos emitidos se conservan.
 */
export default function CancelSaleModal({
  isOpen,
  sale,
  onClose,
  onCanceled,
}: CancelSaleModalProps) {
  const [refundOnCancel, setRefundOnCancel] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cada apertura arranca con la devolución marcada y sin errores viejos.
  useEffect(() => {
    if (isOpen) {
      setRefundOnCancel(true);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, sale?.id]);

  const handleConfirm = async () => {
    if (!sale || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const actualizada = await salesService.cancelSale(sale.id, refundOnCancel);
      onCanceled(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular la operación');
    } finally {
      setIsLoading(false);
    }
  };

  const esPrestamo = sale?.kind === 'PRESTAMO';
  const collectedAmount = sale?.collectedAmount ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esPrestamo ? 'Anular préstamo' : 'Anular venta'}
    >
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que quieres anular {esPrestamo ? 'este préstamo' : 'esta venta'}{' '}
          #{sale?.id}? El registro se conservará como anulado y se repondrá el stock
          del producto. La deuda pendiente quedará en cero.
        </p>

        {collectedAmount > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Monto ya cobrado: {formatCurrency(collectedAmount, sale?.currency ?? undefined)}
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

        {sale?.remito && (
          <p className="mt-2 text-sm text-gray-500">
            El remito N° {sale.remito.numberLabel} ya emitido se conserva.
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Volver
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            Anular
          </Button>
        </div>
      </div>
    </Modal>
  );
}
