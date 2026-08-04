import { SaleResponseDto } from "@/shared/types/sales";
import { DollarSign, CreditCard, CheckCircle, Hash, TrendingUp } from "lucide-react";

interface InfoDetalleTransactionProps {
    transaction: SaleResponseDto
    formatCurrency: (amount: number) => string;
}


export default function StateDetalleTransaction({transaction, formatCurrency}: InfoDetalleTransactionProps) {
    const profit = transaction.priceTotal - transaction.cost;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Ganancia Esperada</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(profit)}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cuotas Acordadas</p>
                <p className="text-2xl font-bold text-indigo-600">{transaction.quantityFees}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl">
                <Hash className="w-6 h-6 text-indigo-600" />
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
                <p className="text-sm font-medium text-gray-600">Costo</p>
                <p className={`text-2xl font-bold text-green-600'}`}>
                  {formatCurrency(transaction.cost)}
                </p>
              </div>
              <div className='bg-green-50 p-3 rounded-xl'>
                <DollarSign className={`w-6 h-6 'text-green-600'}`} />
              </div>
            </div>
          </div>
        </div>
    );

}