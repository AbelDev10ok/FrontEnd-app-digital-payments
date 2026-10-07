import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import Load from '@/shared/components/feedback/Load';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { salesService } from '@/features/ventas/services/salesServices';
import { ProductTypeDto, SaleResponseDto, UpdateSaleRequest } from '@/shared/types/sales';
import SaleForm, { SaleFormData } from '@/features/ventas/components/SaleForm';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const EditarVenta: React.FC<PageProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sale, setSale] = useState<SaleResponseDto | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError('ID de venta no encontrado.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [saleData, productTypesData] = await Promise.all([
          salesService.getSaleById(parseInt(id)),
          salesService.getProductTypes(),
        ]);

        setSale(saleData);
        setProductTypes(productTypesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos para la edición.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFormSubmit = async (data: SaleFormData) => {
    if (!id || !sale) return;

    const updatePayload: UpdateSaleRequest = {
      productType: data.productTypeId,
      // El form de edición no gestiona producto: se conserva el actual (solo VENTA)
      product: sale.kind === 'VENTA' ? (sale.product?.id ?? null) : null,
      descriptionProduct: data.descriptionProduct,
      kind: sale.kind,
    };

    try {
      await salesService.updateSale(parseInt(id), updatePayload);
      navigate(`/dashboard/ventas/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la venta.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Editar" user={user} onLogout={onLogout}>
        <Load message="Cargando datos de la venta..." />
      </DashboardLayout>
    );
  }

  if (error || !sale) {
    return (
      <DashboardLayout title="Error" user={user} onLogout={onLogout}>
        <ErrorMessage message={error || 'No se pudo encontrar la venta.'} />
      </DashboardLayout>
    );
  }

  const isLoan = sale.kind === "PRESTAMO";

  return (
    <DashboardLayout title={isLoan ? `Editar Préstamo #${sale.id}` : `Editar Venta #${sale.id}`} user={user} onLogout={onLogout}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to={`/dashboard/ventas/${id}`} className="p-2 rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-display font-bold tracking-tight text-brand-950 ml-2">{isLoan ? "Editar Préstamo" : "Editar Venta"}</h1>
        </div>

        <SaleForm
          initialValues={sale}
          productTypes={productTypes}
          loading={loading}
          submitLabel="Guardar Cambios"
          cancelTo={`/dashboard/ventas/${id}`}
          onSubmit={handleFormSubmit}
          showFinancialFields={false}
          productTypeLocked={sale.kind === 'VENTA' && !!sale.product}
          descriptionProductLocked={sale.kind === 'VENTA' && !!sale.product}
        />
      </div>
    </DashboardLayout>
  );
};

export default EditarVenta;
