import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorMessage from "@/shared/components/feedback/ErrorMessage";
import Load from "@/shared/components/feedback/Load";
import usePaginatedSales from "@/features/ventas/hooks/usePaginatedSales";
import useProductTypes from "@/features/ventas/hooks/useProductTypes";
import { useSalesFilters } from "@/features/ventas/hooks/useSalesFilters";
import HeaderTransaction from "@/features/ventas/components/HeaderTransaction";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import Paginación from "@/shared/components/ui/Paginacion";
import { FetchParamsSales } from "@/shared/types/sales";
import { salesService } from "@features/ventas/services/salesServices";
import SalesFilters from "@features/ventas/components/SalesFilters";
import SaleTable from "@features/ventas/components/SaleTable";

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
    setSelectedProductType,
    year,
    setYear,
    month,
    setMonth,
    specificDate,
    setSpecificDate,
    showCalendar,
    setShowCalendar,
    date,
  } = useSalesFilters();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const clientNameParam = searchParams.get("clientName");
    if (clientNameParam) {
      setSearchClientName(clientNameParam);
    }
    // read status from URL and update filter
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setSelectedStatus(statusParam);
    } else {
      setSelectedStatus("Todos");
    }
    // read productType from URL and update filter
    const productTypeParam = searchParams.get("productType");
    if (productTypeParam) {
      setSelectedProductType(productTypeParam);
    } else {
      setSelectedProductType("");
    }
  }, [
    searchParams,
    setSearchClientName,
    setSelectedStatus,
    setSelectedProductType,
  ]);

  const { productTypes, loading: productTypesLoading } = useProductTypes();

  const fetcher = async ({ page, size }: { page: number; size: number }) => {
    const params: FetchParamsSales = { page, size };
    if (searchDescription.trim())
      params.descriptionProduct = searchDescription.trim();
    if (searchClientName.trim()) params.clientName = searchClientName.trim();
    if (selectedStatus !== "Todos")
      params.status = selectedStatus.toUpperCase();
    if (selectedProductType) params.productType = selectedProductType;
    if (specificDate) {
      const [y, m, d] = specificDate.split("-").map(Number);
      params.year = y;
      params.month = m;
      params.day = d;
    } else {
      if (year) params.year = parseInt(year);
      if (month) params.month = parseInt(month);
    }
    return salesService.getAllSalesPaginated(params);
  };

  const {
    sales,
    loading: salesLoading,
    error: salesError,
    page,
    setPage,
    totalPages,
  } = usePaginatedSales(fetcher, [
    searchDescription,
    searchClientName,
    selectedStatus,
    selectedProductType,
    productTypes,
    year,
    month,
    specificDate,
  ]);

  return (
    <DashboardLayout title="Todas las Ventas" user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <HeaderTransaction title="Todas las Ventas" />
        {salesError && <ErrorMessage message={salesError} />}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          year={year}
          setYear={setYear}
          month={month}
          setMonth={setMonth}
          specificDate={specificDate}
          setSpecificDate={setSpecificDate}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
        />
        {salesLoading || productTypesLoading ? (
          <Load />
        ) : (
          <SaleTable
            sales={sales}
            emptyMessage={
              searchDescription ||
              searchClientName ||
              selectedStatus !== "Todos" ||
              date
                ? "No se encontraron ventas que coincidan con los filtros"
                : "No hay ventas registradas"
            }
            selectedStatus={selectedStatus}
          />
        )}

        {/* Paginación */}
        {!salesLoading && !productTypesLoading && totalPages > 1 && (
          <Paginación page={page} setPage={setPage} totalPages={totalPages} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TodasVentas;
