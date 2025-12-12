import React from 'react';
import SaleTable from '../../components/sales/SaleTable';
import DashboardLayout from '../../components/dashboard/DashBoardLayout';
import { salesService } from '../../services/salesServices';
import SalesFilters from '../../components/filters/SalesFilters';
import { useSalesFilters } from '../../hooks/useSalesFilters';
import HeaderTransaction from './HeaderTransaction';
import useProductTypes from '../../hooks/useProductTypes';
import usePaginatedSales from '../../hooks/usePaginatedSales';
import { FetchParamsSales } from '../../types/sales';
import Paginación from '../../shared/Paginacion';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import Load from '@/shared/components/feedback/Load';

const TodasVentas: React.FC = () => {
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

  if (salesLoading || productTypesLoading) {
    return (
      <DashboardLayout title="Todas las Ventas">
        <Load />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Todas las Ventas">
      <div className="space-y-6">
        <HeaderTransaction title="Todas las Ventas" />
        {salesError && (
          <ErrorMessage message={salesError} />
        )}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedProductType={selectedProductType}
          onProductTypeChange={setSelectedProductType}
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {/* Sales Table */}
        {(() => {
          const emptyMessage = (searchDescription || searchClientName || selectedStatus !== 'Todos')
            ? 'No se encontraron ventas que coincidan con los filtros'
            : 'No hay ventas registradas';

          return <SaleTable sales={sales} emptyMessage={emptyMessage} />;
        })()}
        {/* Paginación */}
        {totalPages > 1 && (
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