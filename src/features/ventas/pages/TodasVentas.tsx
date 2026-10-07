import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorMessage from "@/shared/components/feedback/ErrorMessage";
import Load from "@/shared/components/feedback/Load";
import usePaginatedSales from "@/features/ventas/hooks/usePaginatedSales";
import { useSalesFilters } from "@/features/ventas/hooks/useSalesFilters";
import HeaderTransaction from "@/features/ventas/components/HeaderTransaction";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import Paginación from "@/shared/components/ui/Paginacion";
import { FetchParamsSales, SaleKind } from "@/shared/types/sales";
import { salesService } from "@features/ventas/services/salesServices";
import SalesFilters from "@features/ventas/components/SalesFilters";
import SaleTable from "@features/ventas/components/SaleTable";

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const TodasVentas: React.FC<PageProps> = ({ user, onLogout }) => {
  const {
    searchDescription,
    setSearchDescription,
    searchClientName,
    setSearchClientName,
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
    date,
  } = useSalesFilters();

  const [selectedKind, setSelectedKind] = useState<SaleKind | "">("");

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const clientNameParam = searchParams.get("clientName");
    if (clientNameParam) {
      setSearchClientName(clientNameParam);
    }

    // read from URL params
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setSelectedStatus(statusParam);
    } else {
      setSelectedStatus("Todos");
    }
    const productTypeParam = searchParams.get("productType");
    if (productTypeParam) {
      setSelectedProductType(productTypeParam);
    } else {
      setSelectedProductType("");
    }
    const kindParam = searchParams.get("kind");
    if (kindParam === "VENTA" || kindParam === "PRESTAMO") {
      setSelectedKind(kindParam);
    } else {
      setSelectedKind("VENTA");
    }
  }, [
    searchParams,
    setSearchClientName,
    setSelectedStatus,
    setSelectedProductType,
  ]);

  const fetcher = async ({ page, size }: { page: number; size: number }) => {
    const params: FetchParamsSales = { page, size };
    if (selectedKind !== "PRESTAMO" && searchDescription.trim())
      params.descriptionProduct = searchDescription.trim();
    if (searchClientName.trim()) params.clientName = searchClientName.trim();
    if (selectedStatus !== "Todos") {
      if (selectedStatus === "A_COBRAR") {
        params.aCobrar = true;
      } else {
        params.status = selectedStatus.toUpperCase();
      }
    }
    if (selectedProductType) params.productType = selectedProductType;
    if (selectedKind) params.kind = selectedKind;
    if (specificDate) {
      const [y, m, d] = specificDate.split("-").map(Number);
      params.year = y;
      params.month = m;
      params.day = d;
    } else {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      if (!isNaN(y) && y >= 2000 && y <= 2100) params.year = y;
      if (!isNaN(m) && m >= 1 && m <= 12) params.month = m;
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
    totalElements,
  } = usePaginatedSales(fetcher, [
    searchDescription,
    searchClientName,
    selectedStatus,
    selectedProductType,
    selectedKind,
    year,
    month,
    specificDate,
  ]);

  const resetFilters = () => {
    setSearchDescription("");
    setSearchClientName("");
    setSelectedStatus("Todos");
    setSelectedProductType("");
    setSpecificDate("");
    setYear("");
    setMonth("");
    const nextParams = new URLSearchParams();
    if (selectedKind) nextParams.set("kind", selectedKind);
    setSearchParams(nextParams);
  };

  const anyFilterActive = Boolean(
    searchDescription ||
    searchClientName ||
    selectedStatus !== "Todos" ||
    selectedProductType ||
    date,
  );

  const pageTtitle = selectedKind === "PRESTAMO" ? "Todos los Préstamos" : "Todas las Ventas";

  return (
    <DashboardLayout title={pageTtitle} user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <HeaderTransaction isLoan={selectedKind === "PRESTAMO"} />
        {salesError && <ErrorMessage message={salesError} />}

        <SalesFilters
          searchTerm={searchDescription}
          onSearchChange={setSearchDescription}
          isLoan={selectedKind === "PRESTAMO"}
          searchClientName={searchClientName}
          onClientNameChange={setSearchClientName}
          year={year}
          setYear={setYear}
          month={month}
          setMonth={setMonth}
          specificDate={specificDate}
          setSpecificDate={setSpecificDate}
          onClearFilters={resetFilters}
        />
        {salesLoading ? (
          <Load />
        ) : (
          <>
            {!salesLoading && totalElements > 0 && (
              <p className="text-sm text-gray-500">
                {totalElements}{" "}
                {totalElements === 1 ? "resultado" : "resultados"}
              </p>
            )}
            <SaleTable
              sales={sales}
              emptyMessage={
                anyFilterActive
                  ? "No se encontraron ventas que coincidan con los filtros"
                  : "No hay ventas registradas"
              }
              selectedStatus={selectedStatus}
            />
          </>
        )}

        {/* Paginación */}
        {!salesLoading && totalPages > 1 && (
          <Paginación page={page} setPage={setPage} totalPages={totalPages} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TodasVentas;
