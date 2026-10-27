import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ErrorMessage from "@/shared/components/feedback/ErrorMessage";
import Load from "@/shared/components/feedback/Load";
import usePaginatedSales from "@/features/ventas/hooks/usePaginatedSales";
import { useSalesFilters } from "@/features/ventas/hooks/useSalesFilters";
import HeaderTransaction from "@/features/ventas/components/HeaderTransaction";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import Paginación from "@/shared/components/ui/Paginacion";
import { FetchParamsSales, SaleDocumentDto, SaleKind, SaleResponseDto } from "@/shared/types/sales";
import { salesService } from "@features/ventas/services/salesServices";
import SalesFilters from "@features/ventas/components/SalesFilters";
import SaleTable from "@features/ventas/components/SaleTable";
import RemitoEmitModal from "@features/ventas/components/RemitoEmitModal";
import CancelSaleModal from "@features/ventas/components/CancelSaleModal";
import DeleteSaleModal from "@features/ventas/components/DeleteSaleModal";
import { useSalesCountsStore } from "@features/ventas/store/salesCountsStore";

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
    selectedSellerId,
    setSelectedSellerId,
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
  // Opciones del filtro por vendedor: activos del negocio + "Sin vendedor"
  const [sellerOptions, setSellerOptions] = useState<{ id: number; name: string }[]>([]);
  const [remitoSale, setRemitoSale] = useState<SaleResponseDto | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<SaleResponseDto | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<SaleResponseDto | null>(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Opciones del filtro por vendedor (se piden una vez)
  useEffect(() => {
    salesService
      .getSellers()
      .then((vendedores) =>
        setSellerOptions(vendedores.map((v) => ({ id: v.id, name: v.name }))),
      )
      .catch((err) => console.error("Error fetching sellers:", err));
  }, []);

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
    // Vendedor por URL (desde la página de Vendedores): "-1" = sin vendedor
    const sellerParam = searchParams.get("sellerId");
    const sinVendedorParam = searchParams.get("withoutSeller");
    if (sinVendedorParam === "true") {
      setSelectedSellerId("-1");
    } else if (sellerParam) {
      setSelectedSellerId(sellerParam);
    } else {
      setSelectedSellerId("");
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
    setSelectedSellerId,
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
    if (selectedSellerId === "-1") {
      params.withoutSeller = true;
    } else if (selectedSellerId) {
      const sellerIdNum = Number(selectedSellerId);
      if (!isNaN(sellerIdNum)) params.sellerId = sellerIdNum;
    }
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
    refresh,
  } = usePaginatedSales(fetcher, [
    searchDescription,
    searchClientName,
    selectedStatus,
    selectedProductType,
    selectedSellerId,
    selectedKind,
    year,
    month,
    specificDate,
  ]);

  // El filtro de fecha arranca en el mes actual: si no hay resultados, el
  // mensaje nombra el período para que no parezca que la venta desapareció.
  const mesNombre = month
    ? new Date(Number(year) || new Date().getFullYear(), Number(month) - 1, 1)
        .toLocaleDateString("es-AR", { month: "long" })
    : "";
  const periodo = mesNombre ? ` en ${mesNombre}${year ? ` de ${year}` : ""}` : "";

  const resetFilters = () => {
    setSearchDescription("");
    setSearchClientName("");
    setSelectedStatus("Todos");
    setSelectedSellerId("");
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
    selectedSellerId ||
    selectedProductType ||
    date,
  );

  const pageTtitle = selectedKind === "PRESTAMO" ? "Todos los Préstamos" : "Todas las Ventas";

  const handleRemito = (sale: SaleResponseDto) => {
    if (sale.remito) {
      window.open(
        `/dashboard/ventas/${sale.id}/remito`,
        "_blank",
        "noopener",
      );
      return;
    }
    setRemitoSale(sale);
  };

  const handleEdit = (sale: SaleResponseDto) => {
    navigate(`/dashboard/ventas/editar/${sale.id}`);
  };

  // El menú muestra conteos por estado: anular o eliminar los mueve.
  const refreshSalesCounts = useSalesCountsStore((state) => state.refresh);

  // Anular y eliminar usan los mismos modales que el detalle: la lista queda
  // operativa sin obligar a entrar a cada venta.
  const handleCanceled = () => {
    setSaleToCancel(null);
    refresh();
    refreshSalesCounts();
  };

  const handleDeleted = () => {
    setSaleToDelete(null);
    refresh();
    refreshSalesCounts();
  };

  const handleRemitoEmitted = (
    document: SaleDocumentDto,
    printWindow: Window | null,
  ) => {
    setRemitoSale(null);
    refresh();
    const url = `/dashboard/ventas/${document.saleId}/remito`;
    if (printWindow) {
      printWindow.location.href = url;
    } else {
      window.location.assign(url);
    }
  };

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
          sellerOptions={sellerOptions}
          selectedSellerId={selectedSellerId}
          onSellerChange={setSelectedSellerId}
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
                  ? `No se encontraron ventas${periodo}`
                  : "No hay ventas registradas"
              }
              selectedStatus={selectedStatus}
              onEdit={handleEdit}
              onRemito={handleRemito}
              onCancel={setSaleToCancel}
              onDelete={setSaleToDelete}
            />
          </>
        )}

        {/* Paginación */}
        {!salesLoading && totalPages > 1 && (
          <Paginación page={page} setPage={setPage} totalPages={totalPages} />
        )}
      </div>

      <RemitoEmitModal
        isOpen={Boolean(remitoSale)}
        sale={remitoSale}
        onClose={() => setRemitoSale(null)}
        onEmitted={handleRemitoEmitted}
      />

      <CancelSaleModal
        isOpen={Boolean(saleToCancel)}
        sale={saleToCancel}
        onClose={() => setSaleToCancel(null)}
        onCanceled={handleCanceled}
      />

      <DeleteSaleModal
        isOpen={Boolean(saleToDelete)}
        sale={saleToDelete}
        onClose={() => setSaleToDelete(null)}
        onDeleted={handleDeleted}
      />
    </DashboardLayout>
  );
};

export default TodasVentas;
