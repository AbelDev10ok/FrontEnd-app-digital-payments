import { useEffect, useState } from 'react';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
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
 * El registro se conserva como anulado y la deuda pendiente queda en cero.
 * Dos efectos se eligen por separado, y ambos arrancan sin marcar: reponer el
 * producto al stock (solo ventas con producto) y asentar la devolución del
 * monto cobrado (solo si hubo cobros). Los remitos emitidos se conservan.
 */
export default function CancelSaleModal({
  isOpen,
  sale,
  onClose,
  onCanceled,
}: CancelSaleModalProps) {
  const [refund, setRefund] = useState(false);
  const [restock, setRestock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cada apertura arranca sin marcar los efectos: reponer el producto o
  // devolver el dinero se elige a conciencia, no por defecto.
  useEffect(() => {
    if (isOpen) {
      setRefund(false);
      setRestock(false);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, sale?.id]);

  const handleConfirm = async () => {
    if (!sale || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const actualizada = await salesService.cancelSale(sale.id, refund, restock);
      onCanceled(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular la operación');
    } finally {
      setIsLoading(false);
    }
  };

  // Mientras la anulación está en vuelo, el modal no se cierra por accidente.
  const handleClose = () => {
    if (!isLoading) onClose();
  };

  const esPrestamo = sale?.kind === 'PRESTAMO';
  const collectedAmount = sale?.collectedAmount ?? 0;
  // Solo una venta con producto tiene unidades que reponer al stock.
  const puedeReponerStock = Boolean(sale && !esPrestamo && sale.product);
  const cantidad = sale?.quantity ?? 1;
  const moneda = sale?.currency ?? undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={esPrestamo ? 'Anular préstamo' : 'Anular venta'}
    >
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que querés anular {esPrestamo ? 'este préstamo' : 'esta venta'}{' '}
          #{sale?.id}? El registro se conserva como anulado y la deuda pendiente
          queda en cero.
        </p>

        {/* Resumen de lo que se anula: quién, qué y por cuánto. */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="text-sm font-medium text-gray-900">
            {sale?.client?.name}
          </p>
          <p
            className="truncate text-sm text-gray-600"
            title={sale?.descriptionProduct}
          >
            {sale?.descriptionProduct}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-mono tabular-nums text-gray-900">
              {formatCurrency(sale?.priceTotal ?? 0, moneda)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-500">Cobrado</span>
            <span className="font-mono tabular-nums text-gray-900">
              {formatCurrency(collectedAmount, moneda)}
            </span>
          </div>
        </div>

        {puedeReponerStock && (
          <label className="mt-4 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">
                Reponer {cantidad} {cantidad === 1 ? 'unidad' : 'unidades'} al stock
              </span>
              <span className="block text-xs text-gray-500">
                Marcá esta opción solo si el producto volvió y está disponible
                para vender.
              </span>
            </span>
          </label>
        )}

        {collectedAmount > 0 ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={refund}
              onChange={(e) => setRefund(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
            />
            <span>
              <span className="block text-sm font-medium text-gray-800">
                Registrar devolución de {formatCurrency(collectedAmount, moneda)}{' '}
                al cliente
              </span>
              <span className="block text-xs text-gray-500">
                Deja asentado que devolviste lo cobrado; no ejecuta un pago.
              </span>
            </span>
          </label>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            No hay cobros registrados que devolver.
          </p>
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
