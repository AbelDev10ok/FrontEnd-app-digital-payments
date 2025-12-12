import React from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';
import { SaleResponseDto } from '../../services/salesServices';
import SaleStatusBadge from './SaleStatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';

type Props = {
  sale: SaleResponseDto;
};

const SaleRow: React.FC<Props> = ({ sale }) => {
  // Use shared formatCurrency util (defaults to ARS)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      timeZone: 'UTC'
    });
  };

  return (
    <tr key={sale.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">#{sale.id}</span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{sale.descriptionProduct}</div>
            <div className="text-sm text-gray-500">{formatDate(sale.dateSale)}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{sale.client.name}</div>
        <div className="text-sm text-gray-500">{sale.client.telefono}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{formatCurrency(sale.amountFe)}</div>
        <div className="text-sm text-gray-500">Deuda : {formatCurrency(sale.remainingAmount)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <SaleStatusBadge sale={sale} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <Link to={`/dashboard/ventas/${sale.id}`} className="text-green-600 hover:text-green-900 mr-4">
          <LinkIcon className="w-4 h-4 inline mr-1" /> Ver
        </Link>
      </td>
    </tr>
  );
};

export default SaleRow;
