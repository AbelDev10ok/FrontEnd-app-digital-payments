import React, { useState } from "react";
import { X, Calendar, DollarSign, Trash2 } from "lucide-react";
import { salesService } from "@/features/ventas/services/salesServices";
import { Button, Input } from "@/shared/components/ui";

interface PostponeFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  saleId: number;
  feeId: number;
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
  currentDate,
  saleDate,
  currentAmount,
  maxAmount,
  currentPaymentDate,
  isPaid,
}) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [newPaymentDate, setNewPaymentDate] = useState(
    currentPaymentDate
      ? new Date(currentPaymentDate).toISOString().split("T")[0]
      : "",
  );
  const [newAmount, setNewAmount] = useState(currentAmount?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const amountVal = parseFloat(newAmount);
    if (amountVal < 0) {
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
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta cuota?"))
      return;

    setLoading(true);
    setError("");

    try {
      await salesService.deleteFee(feeId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar la cuota",
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm">
      <div className="bg-white rounded-card w-full max-w-md p-6 m-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-lg font-bold tracking-tight text-brand-950">
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
                  min={
                    saleDate
                      ? new Date(saleDate).toISOString().split("T")[0]
                      : undefined
                  }
                  className="pl-10 transition-all"
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
                    className="pl-10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto de la Cuota
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    step="0.01"
                    className="pl-10 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  El monto no puede superar la deuda actual: ${maxAmount}
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="dangerOutline"
              onClick={handleDelete}
              disabled={loading}
              title="Eliminar cuota"
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Eliminar</span>
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
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
