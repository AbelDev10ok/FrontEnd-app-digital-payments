import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import { salesService } from '@/features/ventas/services/salesServices';
import type { SaleResponseDto } from '@/shared/types/sales';

interface DeleteSaleModalProps {
  isOpen: boolean;
  sale: SaleResponseDto | null;
  onClose: () => void;
  /** Se llama después de eliminar; la fila desaparece del listado. */
  onDeleted: () => void;
}

/**
 * Eliminación definitiva de una venta o préstamo, compartida por el listado y
 * el detalle. Avisa que los remitos emitidos se eliminan en cascada.
 */
export default function DeleteSaleModal({
  isOpen,
  sale,
  onClose,
  onDeleted,
}: DeleteSaleModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, sale?.id]);

  const handleConfirm = async () => {
    if (!sale || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await salesService.deleteSale(sale.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la operación');
    } finally {
      setIsLoading(false);
    }
  };

  const esPrestamo = sale?.kind === 'PRESTAMO';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar eliminación">
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que quieres eliminar {esPrestamo ? 'este préstamo' : 'esta venta'}?
          Esta acción no se puede deshacer.
        </p>
        {sale?.remito && (
          <p className="mt-3 text-sm font-medium text-red-700">
            También se eliminará el remito N° {sale.remito.numberLabel}.
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            Eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
