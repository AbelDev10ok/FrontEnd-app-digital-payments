import { ArrowLeft, HandCoins, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';
import { PageHeader } from '@/shared/components/ui';

interface Props {
  type?: "VENTA" | "PRESTAMO";
}

/**
 * Encabezado único de la pantalla de alta: título, icono y una sola salida
 * ("Volver"). Antes el icono y la acción eran dos flechas distintas.
 */
const TransactionHeader: React.FC<Props> = ({ type = "VENTA" }) => {
  const isLoan = type === "PRESTAMO";
  return (
    <PageHeader
      title={isLoan ? "Nuevo préstamo" : "Nueva venta"}
      icon={
        isLoan
          ? <HandCoins className="w-6 h-6 text-brand-600" />
          : <ShoppingCart className="w-6 h-6 text-brand-600" />
      }
      actions={
        <Link
          to={isLoan ? "/dashboard/ventas/todas?kind=PRESTAMO" : "/dashboard/ventas/todas"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 rounded-lg px-2 py-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver
        </Link>
      }
    />
  );
};

export default TransactionHeader;
