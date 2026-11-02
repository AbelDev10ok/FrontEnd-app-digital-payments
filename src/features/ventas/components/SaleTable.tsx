import { SaleResponseDto } from "@/shared/types/sales";
import React from "react";
import SaleRow from "./SaleRow";
import { eyebrow, neutral, neutralBg } from "@/shared/theme";

type Props = {
  sales: SaleResponseDto[];
  selectedStatus: string;
  emptyMessage?: string;
  /** Abre la pantalla de edición de la operación. */
  onEdit: (sale: SaleResponseDto) => void;
  /** Emite el remito o abre el ya emitido. */
  onRemito: (sale: SaleResponseDto) => void;
  /** Anula la operación conservando el historial. */
  onCancel: (sale: SaleResponseDto) => void;
  /** Elimina la operación (solo si no tiene cobros). */
  onDelete: (sale: SaleResponseDto) => void;
};

const SaleTable: React.FC<Props> = ({
  sales,
  emptyMessage,
  selectedStatus,
  onEdit,
  onRemito,
  onCancel,
  onDelete,
}) => {
  return (
    <div className="bg-surface rounded-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={neutralBg.tableHeader}>
            <tr>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Venta
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Cliente
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Vendedor
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Monto de cuota
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Estado
              </th>
              <th className={`px-6 py-3 text-right max-md:sticky max-md:right-0 max-md:bg-gray-50 max-md:border-l max-md:border-gray-100 ${eyebrow.table}`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-6 py-8 text-center ${neutral.muted}`}>
                  {emptyMessage ?? "No hay ventas registradas"}
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={sale}
                  selectedStatus={selectedStatus}
                  onEdit={onEdit}
                  onRemito={onRemito}
                  onCancel={onCancel}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SaleTable;