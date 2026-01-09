import React, { useCallback } from 'react';

import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import Load from '@/shared/components/feedback/Load';
import usePaginatedSales from '@/features/ventas/hooks/usePaginatedSales';
import useProductTypes from '@/features/ventas/hooks/useProductTypes';
import { useSalesFilters } from '@/features/ventas/hooks/useSalesFilters';
import HeaderTransaction from '@/features/ventas/components/HeaderTransaction';
import { DashboardLayout } from '@/shared';
import { Paginación } from '@/shared/components/ui';
import { FetchParamsSales } from '@/types/sales';
import { salesService } from '../services/salesServices';
import SalesFilters from '../components/SalesFilters';
import SaleTable from '../components/SaleTable';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const TodasVentas: React.FC<PageProps> = ({ user, onLogout }) => {
  const {
    searchClientName,
    setSearchClientName,
    searchDescription,
    setSearchDescription,
    selectedStatus,
    setSelectedStatus,
    selectedProductType,
    setSelectedProductType
  } = useSalesFilters();

  const statusOptions = ['Todos', 'COMPLETED', 'ACTIVE', 'CANCELED'];

  const { productTypes, loading: productTypesLoading } = useProductTypes();

  const fetcher = async ({ page, size }: { page: number; size: number }) => {
    const params: FetchParamsSales = { page, size };
    if (searchDescription.trim()) params.descriptionProduct = searchDescription.trim();
    if (searchClientName.trim()) params.clientName = searchClientName.trim();
    if (selectedStatus !== 'Todos') params.status = selectedStatus.toUpperCase();
    if (selectedProductType) params.productType = selectedProductType;
    return salesService.getAllSalesPaginated(params);
  };

  const { sales, loading: salesLoading, error: salesError, page, setPage, totalPages } = usePaginatedSales(fetcher, [searchDescription, searchClientName, selectedStatus, selectedProductType, productTypes]);

  return (
    <DashboardLayout title="Todas las Ventas" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <HeaderTransaction title="Todas las Ventas" />
        {salesError && (
          <ErrorMessage message={salesError} />
        )}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={useCallback((v: string) => setSearchDescription(v), [setSearchDescription])}
          searchClientName={searchClientName}
          onClientNameChange={useCallback((v: string) => setSearchClientName(v), [setSearchClientName])}
          selectedStatus={selectedStatus}
          onStatusChange={useCallback((v: string) => setSelectedStatus(v), [setSelectedStatus])}
          selectedProductType={selectedProductType}
          onProductTypeChange={useCallback((v: string) => setSelectedProductType(v), [setSelectedProductType])}
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {/* Sales Table or Loader */}
        {(salesLoading || productTypesLoading) ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Load />
          </div>
        ) : (
          (() => {
            const emptyMessage = (searchDescription || searchClientName || selectedStatus !== 'Todos')
              ? 'No se encontraron ventas que coincidan con los filtros'
              : 'No hay ventas registradas';

            return <SaleTable sales={sales} emptyMessage={emptyMessage} />;
          })()
        )}

        {/* Paginación */}
        {(!salesLoading && totalPages > 1) && (
          <Paginación
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TodasVentas;