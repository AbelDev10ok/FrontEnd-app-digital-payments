import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { DashboardLayout } from '@/shared/components/layout';
import Load from '@/shared/components/feedback/Load';
import ErrorMessage from '@/shared/components/feedback/ErrorMessage';
import { salesService } from '@/features/ventas/services/salesServices';
import { ProductTypeDto, SaleResponseDto, UpdateSaleRequest } from '@/shared/types/sales';

interface PageProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const EditarVenta: React.FC<PageProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sale, setSale] = useState<SaleResponseDto | null>(null);
  const [productTypes, setProductTypes] = useState<ProductTypeDto[]>([]);
  
  // State for form fields
  const [productTypeId, setProductTypeId] = useState<number | ''>('');
  const [descriptionProduct, setDescriptionProduct] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ productTypeId?: string; descriptionProduct?: string }>({});

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

        // Set initial form state
        setProductTypeId(saleData.productType.id);
        setDescriptionProduct(saleData.descriptionProduct);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos para la edición.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const validateForm = () => {
    const newErrors: { productTypeId?: string; descriptionProduct?: string } = {};
    if (!productTypeId) {
      newErrors.productTypeId = 'El tipo de producto es obligatorio';
    }
    if (!descriptionProduct.trim()) {
      newErrors.descriptionProduct = 'La descripción es obligatoria';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm() || !sale || !id) {
      return;
    }

    const updatePayload:UpdateSaleRequest = {

        productType: Number(productTypeId),
        descriptionProduct: descriptionProduct
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
      <DashboardLayout title="Editar Venta" user={user} onLogout={onLogout}>
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

  return (
    <DashboardLayout title={`Editar Venta #${sale.id}`} user={user} onLogout={onLogout}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to={`/dashboard/ventas/${id}`} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-semibold ml-2">Editar Venta</h1>
        </div>

        <form onSubmit={handleFormSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="productTypeId" className="block text-sm font-medium text-gray-700">Tipo de Producto</label>
                <select 
                  id="productTypeId" 
                  value={productTypeId}
                  onChange={(e) => setProductTypeId(Number(e.target.value))}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>Seleccione un tipo</option>
                  {productTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                </select>
                {formErrors.productTypeId && <span className="text-xs text-red-500">{formErrors.productTypeId}</span>}
              </div>

              <div>
                <label htmlFor="descriptionProduct" className="block text-sm font-medium text-gray-700">Descripción del Producto</label>
                <input 
                  id="descriptionProduct" 
                  type="text" 
                  value={descriptionProduct}
                  onChange={(e) => setDescriptionProduct(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                />
                {formErrors.descriptionProduct && <span className="text-xs text-red-500">{formErrors.descriptionProduct}</span>}
              </div>
            </div>
          {/* </div> */}

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditarVenta;
