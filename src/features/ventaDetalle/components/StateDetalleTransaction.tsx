import { DollarSign, CreditCard, CheckCircle, Clock } from "lucide-react";
import { SaleResponseDto } from "../../services/salesServices";

interface InfoDetalleTransactionProps {
    transaction: SaleResponseDto
    formatCurrency: (amount: number) => string;
}


export default function StateDetalleTransaction({transaction, formatCurrency}: InfoDetalleTransactionProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.priceTotal)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(transaction.remainingAmount)}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>


          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuotas Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{transaction.paidFeesCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días de Atraso</p>
                <p className={`text-2xl font-bold ${transaction.daysLate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.daysLate}
                </p>
              </div>
              <div className={`${transaction.daysLate > 0 ? 'bg-red-50' : 'bg-green-50'} p-3 rounded-xl`}>
                <Clock className={`w-6 h-6 ${transaction.daysLate > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
        </div>
    );

}