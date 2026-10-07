import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';
import { PageHeader } from '@/shared/components/ui';

interface Props {
  type?: "VENTA" | "PRESTAMO";
}

const TransactionHeader: React.FC<Props> = ({ type = "VENTA" }) => {
  const isLoan = type === "PRESTAMO";
  return (
    <PageHeader
      subtitle={isLoan ? "Crear nuevo préstamo" : "Crear nueva venta"}
      icon={<ArrowLeft className="w-6 h-6 text-brand-600" />}
      actions={
        <Link
          to={isLoan ? "/dashboard/ventas/todas?kind=PRESTAMO" : "/dashboard/ventas/todas"}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
      }
    />
  );
};

export default TransactionHeader;
