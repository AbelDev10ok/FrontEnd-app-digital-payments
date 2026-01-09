import React from 'react';
import { SaleResponseDto } from '../../services/salesServices';

type Props = {
  sale: SaleResponseDto;
};

const SaleStatusBadge: React.FC<Props> = ({ sale }) => {
  if (sale.completed) {
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completada</span>;
  }

  if (sale.daysLate > 0) {
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Atrasada ({sale.daysLate}d)</span>;
  }

  return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
};

export default SaleStatusBadge;
