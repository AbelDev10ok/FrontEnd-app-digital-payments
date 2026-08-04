import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';
import { PageHeader } from '@/shared/components/ui';

interface Props {
  title?: string;
  subtitle?: string;
}

const TransactionHeader: React.FC<Props> = ({ title = 'Nueva Transacción', subtitle = 'Crear nueva venta' }) => {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      icon={<Plus className="w-6 h-6 text-brand-600" />}
      actions={
        <Link to="/dashboard/ventas" className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
      }
    />
  );
};

export default TransactionHeader;
