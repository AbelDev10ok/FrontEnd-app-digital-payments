
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
import { Paginación } from '@/shared';

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
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          selectedProductType={selectedProductType}
          onProductTypeChange={setSelectedProductType}
          productTypes={productTypes}
          statusOptions={statusOptions}
        />

        {salesLoading || productTypesLoading ? (
          <Load />
        ) : (
        <SaleTable sales={sales} emptyMessage={(searchDescription || searchClientName)
              ? 'No se encontraron ventas que coincidan con los filtros'
              : 'No hay ventas registradas'} />
        )}

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

export default VentasACobrar;