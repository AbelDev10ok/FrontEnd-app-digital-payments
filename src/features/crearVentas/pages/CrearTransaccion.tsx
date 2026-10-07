import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/shared/components/layout/DashboardLayout";
import useSaleForm from "@features/crearVentas/hooks/useSaleForm";
import TransactionHeader from "@features/crearVentas/components/TransactionHeader";
import CreateSaleForm from "@features/crearVentas/components/CreateSaleForm";
import ProductPicker from "@features/crearVentas/components/ProductPicker";
import type { ProductDto } from "@/shared/types/sales";

interface CrearTransaccionProps {
  type: "VENTA" | "PRESTAMO";
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const CrearTransaccionInner = ({ type, user, onLogout }: CrearTransaccionProps) => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"producto" | "detalle">("producto");
  const currentStep = type === "PRESTAMO" ? "detalle" : step;

  const {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    errors,
    isSubmittingDisabled,
    productTypes,
    products,
    sellers,
    displayedClients,
  } = useSaleForm(type);

  const handleProductSelected = (product: ProductDto, cantidad: number) => {
    setFormData((prev) => ({
      ...prev,
      productId: String(product.id),
      cantidad: String(cantidad),
    }));
    setStep("detalle");
  };

  const submitWrapper = async (e: React.FormEvent) => {
    const result = await handleSubmit(e);
    if (result) {
      navigate(type === 'PRESTAMO' ? '/dashboard/ventas/todas?kind=PRESTAMO' : '/dashboard/ventas/todas');
    }
  };

  const pageTitle = type === "PRESTAMO" ? "Nuevo Préstamo" : "Nueva Venta";

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
            isSubmittingDisabled={isSubmittingDisabled}
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
