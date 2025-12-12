import { ArrowLeft, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { SaleResponseDto } from "../services/salesServices";

interface HeaderDetalleTransactionProps {
    transaction: SaleResponseDto;
    isLoan: boolean;
  }


export default function HeaderDetalleTransaction({transaction, isLoan}: HeaderDetalleTransactionProps) {
    return (
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/ventas"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {isLoan ? 'Préstamo' : 'Venta'} #{transaction.id}
            </h2>
            <p className="text-sm text-gray-500">{transaction.descriptionProduct}</p>
          </div>
        </div>
    );
}