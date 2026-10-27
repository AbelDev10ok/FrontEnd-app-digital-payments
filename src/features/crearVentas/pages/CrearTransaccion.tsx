import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import useSaleForm from "@features/crearVentas/hooks/useSaleForm";
import TransactionHeader from "@features/crearVentas/components/TransactionHeader";
import CreateSaleForm from "@features/crearVentas/components/CreateSaleForm";
import ProductPicker from "@features/crearVentas/components/ProductPicker";
import type { ProductDto } from "@/shared/types/sales";
import { useSalesCountsStore } from "@/features/ventas/store/salesCountsStore";

interface CrearTransaccionProps {
  type: "VENTA" | "PRESTAMO";
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const CrearTransaccionInner = ({ type, user, onLogout }: CrearTransaccionProps) => {
  const navigate = useNavigate();
  const refreshSalesCounts = useSalesCountsStore((state) => state.refresh);

  const [step, setStep] = useState<"producto" | "detalle">("producto");
  const currentStep = type === "PRESTAMO" ? "detalle" : step;

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    errors,
    visibleErrors,
    isSubmittingDisabled,
    isSubmitting,
    submitError,
    productTypes,
    products,
    sellers,
    displayedClients,
  } = useSaleForm(type);

  const handleProductSelected = (product: ProductDto, cantidad: number) => {
    setFormData((prev) => ({
      ...prev,
      // La venta guarda la variante/SKU elegida, no el producto base
      productId: String(product.variantId ?? product.id),
      cantidad: String(cantidad),
    }));
    setStep("detalle");
  };

  const submitWrapper = async (e: React.FormEvent) => {
    const result = await handleSubmit(e);
    if (result) {
      // El alta mueve los conteos del menú (Todas / A Cobrar / Activas)
      refreshSalesCounts();
      navigate(type === 'PRESTAMO' ? '/dashboard/ventas/todas?kind=PRESTAMO' : '/dashboard/ventas/todas');
    }
  };

  const pageTitle = type === "PRESTAMO" ? "Nuevo Préstamo" : "Nueva Venta";
  // "Cancelar" vuelve a la lista de operaciones (el destino del envío exitoso);
  // antes apuntaba a una ruta inexistente y el catch-all dejaba la landing abierta.
  const cancelTo = type === "PRESTAMO" ? "/dashboard/ventas/todas?kind=PRESTAMO" : "/dashboard/ventas/todas";

  return (
    <DashboardLayout title={pageTitle} user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <TransactionHeader type={type} />
        {currentStep === "producto" ? (
          <ProductPicker
            products={products}
            productTypes={productTypes}
            onSelect={handleProductSelected}
          />
        ) : (
          <CreateSaleForm
            formData={formData}
            setFormData={setFormData}
            handleInputChange={handleInputChange}
            errors={errors}
            visibleErrors={visibleErrors}
            isSubmittingDisabled={isSubmittingDisabled}
            isSubmitting={isSubmitting}
            submitError={submitError}
            cancelTo={cancelTo}
            products={products}
            sellers={sellers}
            displayedClients={displayedClients}
            onSubmit={submitWrapper}
            onBackToProductPicker={type === "VENTA" ? () => setStep("producto") : undefined}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

const CrearTransaccion = (props: CrearTransaccionProps) => (
  <CrearTransaccionInner key={props.type} {...props} />
);

export default CrearTransaccion;
