import { SaleResponseDto } from "@/shared/types/sales";
import { User, CreditCard, Phone } from "lucide-react";

interface ClientInfoDetalleProps {
    transaction: SaleResponseDto;
}

export default function ClientInfoDetalle({transaction}: ClientInfoDetalleProps) {
  return (
        <div className="bg-white rounded-card p-6 shadow-card">
            <h3 className="font-display text-lg font-bold tracking-tight text-brand-950 mb-4">Información del Cliente</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">{transaction.client.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                {/* si tengo dni */}
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-medium text-gray-900">{transaction.client.dni || 'N/A'}</p>
                </div>

              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{transaction.client.telefono}</p>
                </div>
              </div>
            </div>
          </div>
    );
}