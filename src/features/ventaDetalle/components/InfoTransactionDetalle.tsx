import { SaleResponseDto } from "@/services/salesServices";
import { Calendar, Clock, Package } from "lucide-react";


interface InfoTransactionDetalleProps {
    transaction: SaleResponseDto;
    isLoan: boolean;
    formatDate: (amount: string) => string;
}


export default function InfoTransactionDetalle({transaction, isLoan, formatDate}: InfoTransactionDetalleProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Transacción</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de {isLoan ? 'Préstamo' : 'Venta'}</p>
                  <p className="font-medium text-gray-900">{formatDate(transaction.dateSale)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Fecha Final de Pago</p>
                  <p className="font-medium text-gray-900">{formatDate(transaction.finalPaymentDate)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tipo de Pago</p>
                  <p className="font-medium text-gray-900">
                    {transaction.typePayments}
                  </p>
                </div>
              </div>
            </div>
        </div>
    );
}