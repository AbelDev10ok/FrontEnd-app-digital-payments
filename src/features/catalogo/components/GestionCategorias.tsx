import { useState, useEffect } from 'react';
import { Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Card, Button, Input, Field } from '@/shared/components/ui';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductTypeDto } from '@/shared/types/sales';

const GestionCategorias: React.FC = () => {
  const [categories, setCategories] = useState<ProductTypeDto[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductTypeDto | null>(null);

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    try {
      setCategories(await salesService.getProductTypes());
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Error al cargar las categorías');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    setCategoryError(null);
    try {
      if (editingCategory) {
        await salesService.updateProductType(editingCategory.id, name);
      } else {
        await salesService.createProductType(name);
      }
      resetCategoryForm();
      await loadCategories();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryError(null);
  };

  const handleStartEdit = (category: ProductTypeDto) => {
    setCategoryName(category.name);
    setEditingCategory(category);
    setCategoryError(null);
  };

  const handleDeleteCategory = async (id: number) => {
    setDeletingCategoryId(id);
    setCategoryError(null);
    try {
      await salesService.deleteProductType(id);
      await loadCategories();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Error al eliminar la categoría');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Categorías</h3>
        <Button
          onClick={loadCategories}
          variant="ghost"
          size="sm"
          aria-label="Recargar categorías"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Recargar
        </Button>
      </div>
      <p className="-mt-3 mb-4 text-sm text-gray-500">
        Agrupan productos y ventas; se muestran como filtro en Ventas.
      </p>

      <form onSubmit={handleSubmitCategory} className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Field label="Nueva categoría" htmlFor="categoryName">
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: TV, CELULAR, MUEBLERIA..."
            />
          </Field>
        </div>
        <div className="sm:self-end">
          <div className="flex items-center gap-2">
            <Button type="submit" isLoading={creatingCategory} leftIcon={<Plus className="w-4 h-4" />}>
              {editingCategory ? 'Guardar cambios' : 'Crear'}
            </Button>
            {editingCategory && (
              <Button type="button" variant="ghost" onClick={resetCategoryForm}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </form>

      {categoryError && <p className="text-sm text-red-600 mb-3">{categoryError}</p>}

      {loadingCategories ? (
        <p className="text-sm text-gray-500">Cargando categorías...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-500">No hay categorías registradas.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-brand-600" />
                <span className="font-medium text-gray-900">{cat.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar categoría ${cat.name}`}
                  onClick={() => handleStartEdit(cat)}
                  className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar categoría ${cat.name}`}
                  isLoading={deletingCategoryId === cat.id}
                  onClick={() => handleDeleteCategory(cat.id)}
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

export default GestionCategorias;