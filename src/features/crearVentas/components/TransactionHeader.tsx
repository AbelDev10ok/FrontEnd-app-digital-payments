import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';

interface Props {
  title?: string;
  subtitle?: string;
}

const TransactionHeader: React.FC<Props> = ({ title = 'Nueva Transacción', subtitle = 'Crear nueva venta' }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link to="/dashboard/ventas" className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <Plus className="w-8 h-8 text-indigo-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionHeader;
