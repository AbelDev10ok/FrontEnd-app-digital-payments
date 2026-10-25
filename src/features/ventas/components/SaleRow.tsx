import React from "react";
import { Link } from "react-router-dom";
import { Ban, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import SaleStatusBadge from "./SaleStatusBadge";
import { ActionsMenu, type ActionMenuItem } from "@/shared/components/ui";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { SaleResponseDto } from "@/shared/types/sales";

type Props = {
  sale: SaleResponseDto;
  selectedStatus: string;
  /** Abre la pantalla de edición de la operación. */
  onEdit: (sale: SaleResponseDto) => void;
  /** Emite el remito o abre el ya emitido. */
  onRemito: (sale: SaleResponseDto) => void;
  /** Anula la operación conservando el historial. */
  onCancel: (sale: SaleResponseDto) => void;
  /** Elimina la operación (solo si no tiene cobros). */
  onDelete: (sale: SaleResponseDto) => void;
};

const SaleRow: React.FC<Props> = ({
  sale,
  selectedStatus,
  onEdit,
  onRemito,
  onCancel,
  onDelete,
}) => {
  // Use shared formatCurrency util (defaults to ARS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      timeZone: "UTC",
    });
  };

  const esPrestamo = sale.kind === "PRESTAMO";
  const tipo = esPrestamo ? "préstamo" : "venta";
  const puedeEliminar = (sale.paidFeesCount ?? 0) === 0;

  // Mismas reglas que el detalle: remito solo de ventas emitibles o ya
  // emitidas, anular salvo anuladas y eliminar solo sin cobros.
  const acciones: ActionMenuItem[] = [
    { label: "Editar", icon: Pencil, onSelect: () => onEdit(sale) },
    ...(sale.kind === "VENTA" && (sale.status !== "CANCELED" || sale.remito)
      ? [
          {
            label: sale.remito
              ? `Ver remito N° ${sale.remito.numberLabel}`
              : "Emitir remito",
            icon: Printer,
            tone: "brand" as const,
            onSelect: () => onRemito(sale),
          },
        ]
      : []),
    ...(sale.status !== "CANCELED"
      ? [
          {
            label: `Anular ${tipo}`,
            icon: Ban,
            tone: "warning" as const,
            onSelect: () => onCancel(sale),
          },
        ]
      : []),
    ...(puedeEliminar
      ? [
          {
            label: "Eliminar",
            icon: Trash2,
            tone: "danger" as const,
            onSelect: () => onDelete(sale),
          },
        ]
      : []),
  ];

  return (
    <tr key={sale.id} className="group hover:bg-gray-50/60 transition-colors">
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
      {/* En móvil la tabla scrollea en horizontal: las acciones quedan fijas
          a la derecha para no tener que arrastrar hasta el final de la fila. */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium max-md:sticky max-md:right-0 max-md:bg-white max-md:group-hover:bg-gray-50 max-md:border-l max-md:border-gray-100">
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/dashboard/ventas/${sale.id}`}
            aria-label={`Ver detalle de la ${tipo} #${sale.id}`}
            className="p-2 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </Link>
          <ActionsMenu label={`Acciones de la ${tipo} #${sale.id}`} items={acciones} />
        </div>
      </td>
    </tr>
  );
};

export default SaleRow;
