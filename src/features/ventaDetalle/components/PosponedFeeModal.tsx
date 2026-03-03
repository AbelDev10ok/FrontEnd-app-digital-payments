import React, { useState } from 'react';
import { X, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { salesService } from '@/features/ventas/services/salesServices';

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
  isPaid
}) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [newPaymentDate, setNewPaymentDate] = useState(currentPaymentDate ? new Date(currentPaymentDate).toISOString().split('T')[0] : '');
  const [newAmount, setNewAmount] = useState(currentAmount?.toString() ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const amountVal = parseFloat(newAmount);
    if (amountVal < 0) {
      setError('El monto debe ser positivo y válido');
      setLoading(false);
      return;
    }
    // if (amountVal > maxAmount) {
    //   setError(`El monto no puede ser mayor a la deuda actual (${maxAmount})`);
    //   setLoading(false);
    //   return;
    // }

    try {
      await salesService.postponeFee(saleId, feeId, newDate, amountVal, newPaymentDate || undefined);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error al posponer la fecha de vencimiento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuota?')) return;

    setLoading(true);
    setError('');

    try {
      await salesService.deleteFee(feeId);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuota');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4 shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Posponer Vencimiento</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Vencimiento
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={saleDate ? new Date(saleDate).toISOString().split('T')[0] : undefined}
                className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              La nueva fecha no puede ser anterior a la fecha de venta.
            </p>
          </div>

          {isPaid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                  className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          )}

          {isPaid && (


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto de la Cuota
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                step="0.01"
                className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              El monto no puede superar la deuda actual: ${maxAmount}
            </p>
          </div>

          )}


          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium flex items-center gap-2"
              disabled={loading}
              title="Eliminar cuota"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
            <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium shadow-sm shadow-indigo-200"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Confirmar Cambio'}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostponeFeeModal;
