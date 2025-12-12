import React from 'react';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService } from '../../services/salesServices';
import SaleTable from '../../components/sales/SaleTable';

import HeaderTransaction from './HeaderTransaction';
import SalesFilters from '../../components/filters/SalesFilters';
import { useSalesFilters } from '../../hooks/useSalesFilters';
import useProductTypes from '../../hooks/useProductTypes';
import usePaginatedSales from '../../hooks/usePaginatedSales';
import Load from '@/shared/components/feedback/Load';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';

const VentasACobrar: React.FC = () => {
  const {
    searchClientName,
    setSearchClientName,
    searchDescription,
    setSearchDescription,
    selectedProductType,
    setSelectedProductType
  } = useSalesFilters();

  const statusOptions = ['Todos', 'COMPLETED', 'ACTIVE', 'CANCELED'];

  const { productTypes, loading: productTypesLoading } = useProductTypes();

  type FeesParams = {
    page: number;
    size: number;
    date?: string;
    clientName?: string;
    descriptionProduct?: string;
    productType?: string;
  };

  const fetcher = async ({ page, size }: { page: number; size: number }) => {
    const params: FeesParams = { page, size };
    if (searchDescription.trim()) params.descriptionProduct = searchDescription.trim();
    if (searchClientName.trim()) params.clientName = searchClientName.trim();
  params.productType = selectedProductType ?? undefined;
    return salesService.getFeesDue(params);
  };

  const { sales, loading: salesLoading, error: salesError, page, setPage, totalPages } = usePaginatedSales(fetcher, [searchDescription, searchClientName, selectedProductType, productTypes]);

  if (salesLoading || productTypesLoading) {
    return (
      <DashboardLayout title="Ventas a Cobrar Hoy">
        <Load />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ventas a Cobrar Hoy">
      <div className="space-y-6">
        <HeaderTransaction title="Cobranza" />
        {salesError && (
          <ErrorMessage message={salesError} />
        )}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          selectedProductType={selectedProductType}
          onProductTypeChange={setSelectedProductType}
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {(() => {
          const emptyMessage = (searchDescription || searchClientName)
            ? 'No se encontraron ventas que coincidan con los filtros'
            : 'No hay ventas registradas';

          return <SaleTable sales={sales} emptyMessage={emptyMessage} />;
        })()}
        {/* Paginación */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VentasACobrar;