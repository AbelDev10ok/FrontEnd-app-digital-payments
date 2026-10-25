import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, Select } from '@/shared/components/ui';
import ConfirmDialog from '@/features/catalogo/components/ConfirmDialog';
import ProductFormModal from '@/features/catalogo/components/ProductFormModal';
import { salesService } from '@/features/ventas/services/salesServices';
import type { AttributeDto, ProductDto, ProductTypeDto } from '@/shared/types/sales';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { especificacionesDe, resumenEspecificaciones } from '@/shared/utils/productSpecs';
import { aplanarCategorias, categoriaYDescendientes } from '@/shared/utils/categoryTree';

interface GestionProductosProps {
  products: ProductDto[];
  categories: ProductTypeDto[];
  attributes: AttributeDto[];
  loading: boolean;
  loadError: string | null;
  onReload: () => Promise<void> | void;
  /** Resultado de la última mutación, para el aviso de éxito. */
  feedback: string | null;
  onFeedback: (mensaje: string | null) => void;
}

const normalizar = (texto: string | null | undefined) =>
  (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

/** Cada producto base agrupa sus variantes: el listado devuelve una fila por SKU. */
const agruparPorProducto = (products: ProductDto[]) => {
  const mapa = new Map<number, { base: ProductDto; variantes: ProductDto[] }>();
  products.forEach((fila) => {
    const actual = mapa.get(fila.id);
    if (actual) {
      actual.variantes.push(fila);
    } else {
      mapa.set(fila.id, { base: fila, variantes: [fila] });
    }
  });
  return Array.from(mapa.values());
};

const GestionProductos: React.FC<GestionProductosProps> = ({
  products,
  categories,
  attributes,
  loading,
  loadError,
  onReload,
  feedback,
  onFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterActive, setFilterActive] = useState('todos');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ProductDto | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // El aviso de éxito se retira solo: informa sin estorbar en la próxima tarea.
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => onFeedback(null), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback, onFeedback]);

  const productosAgrupados = useMemo(() => agruparPorProducto(products), [products]);
  const opcionesCategoria = useMemo(() => aplanarCategorias(categories), [categories]);
  // Filtrar por un padre trae los productos de toda su rama.
  const ramaFiltrada = useMemo(
    () => (filterCategory ? categoriaYDescendientes(categories, Number(filterCategory)) : null),
    [categories, filterCategory],
  );

  const filtrados = useMemo(() => {
    const consulta = normalizar(search.trim());
    return productosAgrupados.filter(({ base, variantes }) => {
      if (ramaFiltrada && (base.productTypeId == null || !ramaFiltrada.has(base.productTypeId))) {
        return false;
      }
      if (filterActive === 'activo' && base.productActive === false) return false;
      if (filterActive === 'inactivo' && base.productActive !== false) return false;
      if (!consulta) return true;
      const haystack = normalizar(
        [
          base.name,
          base.brand,
          ...variantes.map((v) => v.sku),
          ...variantes.flatMap((v) => especificacionesDe(v)),
        ]
          .filter(Boolean)
          .join(' '),
      );
      return haystack.includes(consulta);
    });
  }, [productosAgrupados, search, ramaFiltrada, filterActive]);

  const hayFiltros = search.trim() !== '' || filterCategory !== '' || filterActive !== 'todos';

  const limpiarFiltros = () => {
    setSearch('');
    setFilterCategory('');
    setFilterActive('todos');
  };

  const toggleExpandido = (id: number) => {
    setExpanded((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  };

  const handleStartEdit = (productId: number) => {
    setActionError(null);
    setEditingId(productId);
    setFormOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleting || deletingProductId != null) return;
    setDeletingProductId(deleting.id);
    setActionError(null);
    try {
      await salesService.deleteProduct(deleting.id);
      setDeleting(null);
      onFeedback('Producto eliminado');
      await onReload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar el producto');
      setDeleting(null);
    } finally {
      setDeletingProductId(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500">
            Cada producto puede tener varias variantes (SKU); la venta elige una y usa su costo, su precio y su
            stock.
          </p>
          <Button
            onClick={() => onReload()}
            variant="ghost"
            size="sm"
            aria-label="Recargar productos"
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Recargar
          </Button>
        </div>

        {/* Buscador y filtros */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              aria-label="Buscar productos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o marca…"
              className="pl-9"
            />
          </div>
          <Select
            aria-label="Filtrar por categoría"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="sm:w-52"
          >
            <option value="">Todas las categorías</option>
            {opcionesCategoria.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'— '.repeat(cat.depth)}
                {cat.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filtrar por estado"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="sm:w-44"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </Select>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setActionError(null); setEditingId(null); setFormOpen(true); }}>
            Nuevo producto
          </Button>
        </div>

        {feedback && (
          <Alert tone="success">{feedback}</Alert>
        )}
        {actionError && <Alert tone="danger">{actionError}</Alert>}

        {loading ? (
          <p role="status" className="text-sm text-gray-500">
            Cargando productos...
          </p>
        ) : loadError ? (
          <Alert tone="danger">{loadError}</Alert>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center">
            {hayFiltros ? (
              <>
                <p className="text-sm text-gray-500">No hay productos que coincidan con la búsqueda.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">No hay productos registrados.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => { setEditingId(null); setFormOpen(true); }}
                >
                  Crear producto
                </Button>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtrados.map(({ base, variantes }) => {
              const stockTotal = variantes.reduce((total, v) => total + (v.stock ?? 0), 0);
              const resumen = resumenEspecificaciones(variantes);
              const precios = variantes.map((v) => v.price).filter((p): p is number => p != null);
              const precioMin = precios.length > 0 ? Math.min(...precios) : null;
              const precioMax = precios.length > 0 ? Math.max(...precios) : null;
              const rangoPrecio =
                precioMin == null
                  ? 'Sin precio'
                  : precioMin === precioMax
                    ? formatCurrency(precioMin, base.currency ?? undefined)
                    : `${formatCurrency(precioMin, base.currency ?? undefined)} – ${formatCurrency(precioMax!, base.currency ?? undefined)}`;
              const abierto = expanded.has(base.id);
              const panelId = `variantes-producto-${base.id}`;
              return (
                <li key={base.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{base.name}</h3>
                        {base.productActive === false && <Badge tone="neutral">Inactivo</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {resumen ? `${resumen} · ` : ''}
                        {base.productTypeName ?? 'Sin categoría'}
                        {' · Stock total: '}
                        {stockTotal}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 font-mono tabular-nums">{rangoPrecio}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Editar producto ${base.name}`}
                        onClick={() => handleStartEdit(base.id)}
                        className="text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Eliminar producto ${base.name}`}
                        onClick={() => { setActionError(null); setDeleting(base); }}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-expanded={abierto}
                    aria-controls={panelId}
                    onClick={() => toggleExpandido(base.id)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {abierto ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    {variantes.length === 1 ? '1 variante' : `${variantes.length} variantes`}
                  </button>

                  {abierto && (
                    <ul id={panelId} className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                      {variantes.map((v) => {
                        const specs = especificacionesDe(v);
                        return (
                          <li key={v.variantId ?? `${base.id}-${v.sku}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex min-w-0 items-center gap-2 text-gray-600">
                              <Package className="w-4 h-4 shrink-0 text-brand-600" />
                              <span className="truncate">
                                {specs.length > 0 ? `${specs.join(' · ')} · ` : ''}
                                {v.sku ?? 'Sin SKU'}
                                {v.active === false ? ' · inactiva' : ''}
                              </span>
                            </span>
                            <span className="shrink-0 text-gray-500 font-mono tabular-nums">
                              {v.price != null ? formatCurrency(v.price, v.currency ?? undefined) : 'Sin precio'}
                              {' · '}
                              Stock: {v.stock ?? 0}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ProductFormModal
        isOpen={formOpen}
        editingRows={editingId != null ? products.filter((p) => p.id === editingId) : null}
        categories={categories}
        attributes={attributes}
        onClose={() => setFormOpen(false)}
        onSaved={(mensaje) => {
          onFeedback(mensaje);
          void onReload();
        }}
      />

      <ConfirmDialog
        isOpen={deleting != null}
        title="Eliminar producto"
        message={`¿Eliminar «${deleting?.name ?? ''}» y todas sus variantes? Esta acción no se puede deshacer.`}
        isLoading={deletingProductId != null}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleting(null)}
      />
    </Card>
  );
};

export default GestionProductos;
