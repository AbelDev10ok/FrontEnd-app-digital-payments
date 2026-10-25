import { useEffect, useState } from 'react';
import { Folder, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, Button, Card, Field, Input, Select } from '@/shared/components/ui';
import Modal from '@/shared/components/ui/Modal';
import ConfirmDialog from '@/features/catalogo/components/ConfirmDialog';
import { salesService } from '@/features/ventas/services/salesServices';
import type { ProductDto, ProductTypeDto } from '@/shared/types/sales';
import { aplanarCategorias, descendientesDe } from '@/shared/utils/categoryTree';

/** Slug propuesto desde el nombre: minúsculas, sin acentos y con guiones. */
const slugify = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface GestionCategoriasProps {
  categories: ProductTypeDto[];
  /** Se usa sólo para advertir en la confirmación de borrado. */
  products: ProductDto[];
  loading: boolean;
  loadError: string | null;
  onReload: () => Promise<void> | void;
  feedback: string | null;
  onFeedback: (mensaje: string | null) => void;
}

const GestionCategorias: React.FC<GestionCategoriasProps> = ({
  categories,
  products,
  loading,
  loadError,
  onReload,
  feedback,
  onFeedback,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductTypeDto | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [deleting, setDeleting] = useState<ProductTypeDto | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => onFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onFeedback]);

  const ordenadas = aplanarCategorias(categories);

  const abrirAlta = (parentId: number | null = null) => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryParentId(parentId != null ? String(parentId) : '');
    setCategorySlug('');
    setCategoryError(null);
    setFormOpen(true);
  };

  const abrirEdicion = (category: ProductTypeDto) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryParentId(category.parentId != null ? String(category.parentId) : '');
    setCategorySlug(category.slug ?? '');
    setCategoryError(null);
    setFormOpen(true);
  };

  const resetCategoryForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setCategoryParentId('');
    setCategorySlug('');
    setCategoryError(null);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingCategory) return;
    const name = categoryName.trim();
    if (!name) {
      setCategoryError('Ingresá un nombre para la categoría');
      return;
    }
    setCreatingCategory(true);
    setCategoryError(null);
    try {
      const payload = {
        name,
        parentId: categoryParentId ? Number(categoryParentId) : null,
        // Vacío = el backend lo genera desde el nombre
        slug: categorySlug.trim() || null,
      };
      if (editingCategory) {
        await salesService.updateProductType(editingCategory.id, payload);
        onFeedback('Categoría actualizada');
      } else {
        await salesService.createProductType(payload);
        onFeedback('Categoría creada');
      }
      resetCategoryForm();
      await onReload();
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Error al guardar la categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleting || deletingCategoryId != null) return;
    setDeletingCategoryId(deleting.id);
    setActionError(null);
    try {
      await salesService.deleteProductType(deleting.id);
      setDeleting(null);
      onFeedback('Categoría eliminada');
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar la categoría');
      setDeleting(null);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // No puede ser su propio padre ni colgar de una descendiente (ciclos)
  const padresProhibidos = editingCategory
    ? new Set([editingCategory.id, ...descendientesDe(categories, editingCategory.id)])
    : new Set<number>();
  const parentOptions = ordenadas.filter((cat) => !padresProhibidos.has(cat.id));

  // Colgar una subcategoría de una categoría con productos deja esos productos
  // en el nivel principal: se avisa para poder moverlos después.
  const padreSeleccionado = categoryParentId
    ? categories.find((cat) => String(cat.id) === categoryParentId) ?? null
    : null;
  const productosEnPadre = padreSeleccionado
    ? products.filter((p) => p.productTypeId === padreSeleccionado.id).length
    : 0;
  const avisoPadreConProductos =
    padreSeleccionado && productosEnPadre > 0
      ? productosEnPadre === 1
        ? `«${padreSeleccionado.name}» tiene 1 producto asignado: queda en la categoría principal hasta que lo muevas a una subcategoría.`
        : `«${padreSeleccionado.name}» tiene ${productosEnPadre} productos asignados: quedan en la categoría principal hasta que los muevas a una subcategoría.`
      : null;

  const advertenciaBorrado = (category: ProductTypeDto | null) => {
    if (!category) return undefined;
    const hijas = categories.filter((c) => c.parentId === category.id).length;
    const productos = products.filter((p) => p.productTypeId === category.id).length;
    const partes: string[] = [];
    if (hijas > 0) partes.push(hijas === 1 ? '1 subcategoría' : `${hijas} subcategorías`);
    if (productos > 0) partes.push(productos === 1 ? '1 producto' : `${productos} productos`);
    return partes.length > 0 ? `Tiene ${partes.join(' y ')} asociados.` : undefined;
  };

  const renderNodos = (parentId: number | null): React.ReactNode => {
    const hijos = ordenadas.filter((cat) => (cat.parentId ?? null) === parentId);
    if (hijos.length === 0) return null;
    return (
      <ul className={parentId == null ? '' : 'ml-3 border-l border-gray-200 pl-3'}>
        {hijos.map((cat) => (
          <li key={cat.id}>
            <div className="flex items-center justify-between gap-2 rounded-xl py-2 pl-2 pr-1 hover:bg-gray-50">
              <div className="flex min-w-0 items-center gap-2">
                <Folder className="w-4 h-4 shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{cat.name}</p>
                  {cat.slug && <p className="truncate text-xs text-gray-500">{cat.slug}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Agregar subcategoría en ${cat.name}`}
                  onClick={() => abrirAlta(cat.id)}
                  className="text-brand-700 hover:bg-brand-50 hover:text-brand-800"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar categoría ${cat.name}`}
                  onClick={() => abrirEdicion(cat)}
                  className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar categoría ${cat.name}`}
                  onClick={() => { setActionError(null); setDeleting(cat); }}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {renderNodos(cat.id)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500">
            Agrupan productos y ventas; pueden colgar de otra categoría. Se muestran como filtro en Ventas.
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onReload()}
              variant="ghost"
              size="sm"
              aria-label="Recargar categorías"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Recargar
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => abrirAlta()}>
              Nueva categoría
            </Button>
          </div>
        </div>

        {feedback && <Alert tone="success">{feedback}</Alert>}
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        {loading ? (
          <p role="status" className="text-sm text-gray-500">
            Cargando categorías...
          </p>
        ) : loadError ? (
          <Alert tone="danger">{loadError}</Alert>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">No hay categorías registradas.</p>
            <Button size="sm" className="mt-3" leftIcon={<Plus className="w-4 h-4" />} onClick={() => abrirAlta()}>
              Nueva categoría
            </Button>
          </div>
        ) : (
          renderNodos(null)
        )}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={resetCategoryForm}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={handleSubmitCategory} noValidate>
          <Field
            label="Nombre"
            htmlFor="categoryName"
            required
            error={categoryError ?? undefined}
            hint={editingCategory ? undefined : 'Ej: TV, CELULAR, MUEBLERIA…'}
          >
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: TV"
            />
          </Field>
          <div className="mt-3">
            <Field label="Categoría padre (opcional)" htmlFor="categoryParentId">
              <Select
                id="categoryParentId"
                value={categoryParentId}
                onChange={(e) => setCategoryParentId(e.target.value)}
              >
                <option value="">Sin categoría padre</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {'— '.repeat(cat.depth)}
                    {cat.name}
                  </option>
                ))}
              </Select>
              {avisoPadreConProductos && (
                <p className="mt-1.5 text-sm text-amber-600">{avisoPadreConProductos}</p>
              )}
            </Field>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
              Configuración avanzada
            </summary>
            <div className="mt-2">
              <Field
                label="Slug (opcional)"
                htmlFor="categorySlug"
                hint="Vacío: se genera desde el nombre"
              >
                <Input
                  id="categorySlug"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder={slugify(categoryName) || 'se-genera-del-nombre'}
                />
              </Field>
            </div>
          </details>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={resetCategoryForm} disabled={creatingCategory}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={creatingCategory} leftIcon={<Plus className="w-4 h-4" />}>
              {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleting != null}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría «${deleting?.name ?? ''}»? Esta acción no se puede deshacer.`}
        warning={advertenciaBorrado(deleting)}
        isLoading={deletingCategoryId != null}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
};

export default GestionCategorias;
