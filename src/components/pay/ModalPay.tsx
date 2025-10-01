import { X, Loader2 } from 'lucide-react';

export interface ModalPayProps {
  open: boolean;
  onClose: () => void;
  selectedFee: { id: number; amount: number; numberFee: number } | null;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  remainingDebt: number;
  onConfirm: () => void;
  processingFeeId: number | null;
  formatCurrency: (amount: number) => string;
}

export const ModalPay: React.FC<ModalPayProps> = ({
  open,
  onClose,
  selectedFee,
  paymentAmount,
  onPaymentAmountChange,
  remainingDebt,
  onConfirm,
  processingFeeId,
  formatCurrency,
}) => {
  if (!open || !selectedFee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Pagar Cuota #{selectedFee.numberFee}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Monto total de la cuota:</span>
                <span className="font-medium">
                {formatCurrency(Number(selectedFee.amount) || 0)}
                </span>            
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Deuda restante:</span>
              <span className={`font-medium ${remainingDebt > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(remainingDebt)}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Monto a pagar *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => onPaymentAmountChange(e.target.value)}
                min="0"
                max={selectedFee.amount}
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
            </div>
            {parseFloat(paymentAmount) >selectedFee.amount && (
              <p className="mt-1 text-sm text-red-600">
                El monto no puede ser mayor al total de la cuota
              </p>
            )}
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                parseFloat(paymentAmount) > selectedFee.amount ||
                processingFeeId === selectedFee.id
              }
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingFeeId === selectedFee.id ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Procesando...
                </div>
              ) : (
                'Confirmar Pago'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};