import React, { useState } from "react";
import { X, Calendar, Trash2 } from "lucide-react";
import { salesService } from "@/features/ventas/services/salesServices";
import { useSalesCountsStore } from "@/features/ventas/store/salesCountsStore";
import { Button, Input } from "@/shared/components/ui";
import { formatCurrency, getCurrencySymbol } from "@/shared/utils/formatCurrency";
import { toInputDate } from "@/shared/utils/formatDate";

interface PostponeFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  saleId: number;
  feeId: number;
  /** Moneda ISO 4217 heredada de la venta (snapshot de la transacción) */
  currency?: string | null;
  currentDate: string;
  saleDate: string;
  currentAmount: number;
  maxAmount: number;
  currentPaymentDate?: string;
  isPaid: boolean;
}

const PostponeFeeModal: React.FC<PostponeFeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  saleId,
  feeId,
  currency,
  currentDate,
  saleDate,
  currentAmount,
  maxAmount,
  currentPaymentDate,
  isPaid,
}) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [newPaymentDate, setNewPaymentDate] = useState(
    currentPaymentDate ? toInputDate(currentPaymentDate) : "",
  );
  const [newAmount, setNewAmount] = useState(currentAmount?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Editar o eliminar una cuota mueve los conteos del menú (A Cobrar / Activas).
  const refreshSalesCounts = useSalesCountsStore((state) => state.refresh);

  if (!isOpen) return null;

  // '$' en ARS, 'US$' en USD: el monto ya pertenece a la moneda de la venta.
  const simbolo = getCurrencySymbol(currency ?? undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Evita doble envío (Enter repetido) mientras se guarda o se elimina.
    if (loading || deleting) return;
    setLoading(true);
    setError("");

    const amountVal = parseFloat(newAmount);
    if (!Number.isFinite(amountVal) || amountVal < 0) {
      setError("El monto debe ser positivo y válido");
      setLoading(false);
      return;
    }
    // El recálculo del backend devuelve al saldo: remaining += (oldAmount - newAmount).
    // Para que el saldo nunca quede negativo debe cumplirse newAmount - oldAmount <= remaining.
    if (isPaid && currentAmount != null && amountVal - currentAmount > maxAmount) {
      setError("El monto no puede superar el saldo restante de la venta");
      setLoading(false);
      return;
    }

    try {
      await salesService.postponeFee(
        saleId,
        feeId,
        newDate,
        amountVal,
        newPaymentDate || undefined,
      );
      refreshSalesCounts();
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al posponer la cuota",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading || deleting) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta cuota?"))
      return;

    setDeleting(true);
    setError("");

    try {
      await salesService.deleteFee(feeId);
      refreshSalesCounts();
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la cuota",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm">
      <div className="bg-surface rounded-card w-full max-w-md p-6 m-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-lg font-bold tracking-tight text-heading">
            {isPaid ? "Editar Cuota Pagada" : "Posponer Vencimiento"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isPaid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={saleDate ? toInputDate(saleDate) : undefined}
                  className="pl-10 transition-[border-color,box-shadow] duration-150 ease-out"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                La nueva fecha no puede ser anterior a la fecha de venta.
              </p>
            </div>
          )}

          {isPaid && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="date"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    className="pl-10 transition-[border-color,box-shadow] duration-150 ease-out"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto de la Cuota
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 pointer-events-none">
                    {simbolo}
                  </span>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className={`${simbolo.length > 1 ? 'pl-12' : 'pl-8'} transition-[border-color,box-shadow] duration-150 ease-out`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  El monto no puede superar la deuda actual: {formatCurrency(maxAmount, currency ?? undefined)}
                </p>
              </div>
            </>
          )}

          {error && (
            <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="dangerOutline"
              onClick={handleDelete}
              disabled={loading || deleting}
              title="Eliminar cuota"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">
                {deleting ? "Eliminando..." : "Eliminar"}
              </span>
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading || deleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || deleting}
              >
                {loading ? "Guardando..." : "Confirmar Cambio"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostponeFeeModal;
