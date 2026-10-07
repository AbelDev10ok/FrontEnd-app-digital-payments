import { SaleResponseDto } from "@/shared/types/sales";
import React from "react";
import SaleRow from "./SaleRow";
import { eyebrow, neutral, neutralBg } from "@/shared/theme";

type Props = {
  sales: SaleResponseDto[];
  selectedStatus: string;
  emptyMessage?: string;
};

const SaleTable: React.FC<Props> = ({
  sales,
  emptyMessage,
  selectedStatus,
}) => {
  return (
    <div className="bg-white rounded-card shadow-card">
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
                Monto de cuota
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
                Estado
              </th>
              <th className={`px-6 py-3 text-left ${eyebrow.table}`}>
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