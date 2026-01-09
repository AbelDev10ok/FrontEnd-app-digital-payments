import React, { useCallback } from 'react';

import HeaderTransaction from '../components/HeaderTransaction';
import { useSalesFilters } from '../hooks/useSalesFilters';
import useProductTypes from '../hooks/useProductTypes';
import usePaginatedSales from '../hooks/usePaginatedSales';
import Load from '@/shared/components/feedback/Load';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { salesService } from '../services/salesServices';
import SalesFilters from '../components/SalesFilters';
import SaleTable from '../components/SaleTable';
import { DashboardLayout } from '@/shared/components/layout';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const VentasACobrar: React.FC<PageProps> = ({ user, onLogout }) => {
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

  return (
    <DashboardLayout title="Ventas a Cobrar Hoy" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <HeaderTransaction title="Cobranza" />
        {salesError && (
          <ErrorMessage message={salesError} />
        )}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={useCallback((v: string) => setSearchDescription(v), [setSearchDescription])}
          searchClientName={searchClientName}
          onClientNameChange={useCallback((v: string) => setSearchClientName(v), [setSearchClientName])}
          selectedProductType={selectedProductType}
          onProductTypeChange={useCallback((v: string) => setSelectedProductType(v), [setSelectedProductType])}
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {/* Table or loader (keep filters mounted while loading) */}
        {(salesLoading || productTypesLoading) ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Load />
          </div>
        ) : (
          (() => {
            const emptyMessage = (searchDescription || searchClientName)
              ? 'No se encontraron ventas que coincidan con los filtros'
              : 'No hay ventas registradas';

            return <SaleTable sales={sales} emptyMessage={emptyMessage} />;
          })()
        )}

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