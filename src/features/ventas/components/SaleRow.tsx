import React from "react";
import { Link } from "react-router-dom";
import { Link as LinkIcon, Printer } from "lucide-react";
import SaleStatusBadge from "./SaleStatusBadge";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { SaleResponseDto } from "@/shared/types/sales";

type Props = {
  sale: SaleResponseDto;
  selectedStatus: string;
  /** Emite el remito o abre el ya emitido. */
  onRemito: (sale: SaleResponseDto) => void;
};

const SaleRow: React.FC<Props> = ({ sale, selectedStatus, onRemito }) => {
  // Use shared formatCurrency util (defaults to ARS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      timeZone: "UTC",
    });
  };

  return (
    <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-brand-600 shadow-sm rounded-full flex items-center justify-center">
            <span className="text-white font-mono font-medium text-sm">
              #{sale.id}
            </span>
          </div>
          <div className="ml-4">
            <div
              className="text-sm font-medium text-gray-900 max-w-[14rem] truncate"
              title={sale.descriptionProduct}
            >
              {sale.descriptionProduct}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(sale.dateSale)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div
          className="text-sm font-medium text-gray-900 max-w-[10rem] truncate"
          title={sale.client.name}
        >
          {sale.client.name}
        </div>
        <div className="text-sm text-gray-500">{sale.client.telefono}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 font-mono tabular-nums">
          {formatCurrency(sale.amountFee, sale.currency ?? undefined)}
        </div>
        <div className="text-sm text-gray-500 font-mono tabular-nums">
          Deuda : {formatCurrency(sale.remainingAmount, sale.currency ?? undefined)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <SaleStatusBadge sale={sale} selectedStatus={selectedStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <Link
          to={`/dashboard/ventas/${sale.id}`}
          className="text-brand-600 hover:text-brand-900 mr-4"
        >
          <LinkIcon className="w-4 h-4 inline mr-1" /> Ver
        </Link>
        {sale.kind === "VENTA" &&
          (sale.status !== "CANCELED" || sale.remito) && (
            <button
              type="button"
              onClick={() => onRemito(sale)}
              title={
                sale.remito
                  ? `Ver remito N° ${sale.remito.numberLabel}`
                  : "Emitir remito"
              }
              aria-label={
                sale.remito
                  ? `Ver remito N° ${sale.remito.numberLabel}`
                  : "Emitir remito"
              }
              className="text-gray-600 hover:text-brand-900 transition-colors"
            >
              <Printer className="w-4 h-4 inline mr-1" />
              Remito
            </button>
          )}
      </td>
    </tr>
  );
};

export default SaleRow;
