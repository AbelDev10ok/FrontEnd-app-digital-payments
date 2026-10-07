import { useState, useEffect } from 'react';
import { Pencil, Package, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Card, Button, Input, Field, Select } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto, ProductTypeDto } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';

const GestionProductos: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<ProductTypeDto[]>([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productTypeId, setProductTypeId] = useState('');
  const [productError, setProductError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  const loadProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      setProducts(await salesService.getProducts());
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Error al cargar los productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    salesService
      .getProductTypes()
      .then(setCategories)
      .catch(() => {
        // La categoría es obligatoria; sin ella no se puede crear un producto.
      });
    loadProducts();
  }, []);

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = productName.trim();
    if (!name) return;
    if (!productTypeId) {
      setProductError('Selecciona una categoría para el producto');
      return;
    }
    const price = productPrice ? Number(productPrice) : null;
    if (price != null && price <= 0) {
      setProductError('El precio debe ser mayor a 0');
      return;
    }
    const stock = productStock !== '' ? Number(productStock) : null;
    if (stock != null && stock < 0) {
      setProductError('El stock no puede ser negativo');
      return;
    }
    setCreatingProduct(true);
    setProductError(null);
    try {
      const payload = {
        name,
        price,
        stock,
        productTypeId: Number(productTypeId),
      };
      if (editingProduct) {
        await salesService.updateProduct(editingProduct.id, payload);
        resetProductForm();
      } else {
        await salesService.createProduct(payload);
        resetProductForm();
      }
      await loadProducts();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Error al guardar el producto');
    } finally {
      setCreatingProduct(false);
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductName('');
    setProductPrice('');
    setProductStock('');
    setProductTypeId('');
    setProductError(null);
  };

  const handleStartEdit = (product: ProductDto) => {
    setProductName(product.name);
    setProductPrice(product.price != null ? String(product.price) : '');
    setProductStock(product.stock != null ? String(product.stock) : '');
    setProductTypeId(product.productTypeId != null ? String(product.productTypeId) : '');
    setEditingProduct(product);
    setProductError(null);
  };

  const handleDeleteProduct = async (id: number) => {
    setDeletingProductId(id);
    setProductError(null);
    try {
      await salesService.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Error al eliminar el producto');
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Productos</h3>
        <Button
          onClick={loadProducts}
          variant="ghost"
          size="sm"
          aria-label="Recargar productos"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Recargar
        </Button>
      </div>
      <p className="-mt-3 mb-4 text-sm text-gray-500">
        Se usan para autocompletar la descripción y el costo en las ventas.
      </p>

      <form onSubmit={handleSubmitProduct} className="grid grid-cols-1 gap-3 mb-4">
        <div>
          <Field label="Nuevo producto" htmlFor="productName">
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Ej: Heladera Samsung 320L"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Precio (opcional)" htmlFor="productPrice">
            <Input
              id="productPrice"
              type="number"
              min="0"
              step="0.01"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="0.00"
            />
          </Field>
          <Field label="Stock (opcional)" htmlFor="productStock">
            <Input
              id="productStock"
              type="number"
              min="0"
              step="1"
              value={productStock}
              onChange={(e) => setProductStock(e.target.value)}
              placeholder="Vacío = sin control"
            />
          </Field>
          <Field label="Categoría *" htmlFor="productTypeId">
            <Select
              id="productTypeId"
              value={productTypeId}
              onChange={(e) => setProductTypeId(e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" isLoading={creatingProduct} leftIcon={<Plus className="w-4 h-4" />}>
            {editingProduct ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          {editingProduct && (
            <Button type="button" variant="ghost" onClick={resetProductForm}>
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {productError && <p className="text-sm text-red-600 mb-3">{productError}</p>}

      {loadingProducts ? (
        <p className="text-sm text-gray-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">No hay productos registrados.</p>
      ) : (
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-brand-600" />
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    {product.price != null ? formatCurrency(product.price) : 'Sin precio'}
                    {product.productTypeName ? ` · ${product.productTypeName}` : ''}
                    {product.stock != null ? ` · Stock: ${product.stock}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar producto ${product.name}`}
                  onClick={() => handleStartEdit(product)}
                  className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar producto ${product.name}`}
                  isLoading={deletingProductId === product.id}
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default GestionProductos;