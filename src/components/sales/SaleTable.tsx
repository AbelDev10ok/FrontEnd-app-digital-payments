import React from 'react';
import { SaleResponseDto } from '../../services/salesServices';
import SaleRow from './SaleRow';

type Props = {
  sales: SaleResponseDto[];
  emptyMessage?: string;
};

const SaleTable: React.FC<Props> = ({ sales, emptyMessage }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto de cuota</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {emptyMessage ?? 'No hay ventas registradas'}
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <SaleRow key={sale.id} sale={sale} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SaleTable;
