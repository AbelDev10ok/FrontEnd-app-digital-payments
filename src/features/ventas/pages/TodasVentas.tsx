
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const clientNameParam = searchParams.get('clientName');
    if (clientNameParam) {
      setSearchClientName(clientNameParam);
    }
  }, [searchParams, setSearchClientName]);

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
        {salesLoading || productTypesLoading ? (
          <Load />
        ) : 
          <SaleTable sales={sales} emptyMessage={(searchDescription || searchClientName || selectedStatus !== 'Todos')
              ? 'No se encontraron ventas que coincidan con los filtros'
              : 'No hay ventas registradas'} />
        }

        {/* Paginación */}
        {(!salesLoading && !productTypesLoading && totalPages > 1) && (
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