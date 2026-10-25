import { useCallback, useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import GestionCategorias from '@/features/catalogo/components/GestionCategorias';
import GestionAtributos from '@/features/catalogo/components/GestionAtributos';
import GestionProductos from '@/features/catalogo/components/GestionProductos';
import { salesService } from '@/features/ventas/services/salesServices';
import type { AttributeDto, ProductDto, ProductTypeDto } from '@/shared/types/sales';
import { initCurrency } from '@/shared/utils/formatCurrency';

interface ProductosProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const TABS = [
  { id: 'productos', label: 'Productos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'atributos', label: 'Atributos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const Productos: React.FC<ProductosProps> = ({ user, onLogout }) => {
  // El catálogo se carga una sola vez para las tres vistas: crear una categoría
  // o un atributo deja listo el formulario de productos sin recargas cruzadas.
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<ProductTypeDto[]>([]);
  const [attributes, setAttributes] = useState<AttributeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('productos');

  const [productosFeedback, setProductosFeedback] = useState<string | null>(null);
  const [categoriasFeedback, setCategoriasFeedback] = useState<string | null>(null);
  const [atributosFeedback, setAtributosFeedback] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [prods, cats, attrs] = await Promise.all([
        salesService.getProducts(),
        salesService.getProductTypes(),
        salesService.getAttributes(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setAttributes(attrs);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar el catálogo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initCurrency();
    void loadCatalog();
  }, [loadCatalog]);

  const productosCount = new Set(products.map((p) => p.id)).size;

  const onKeyTab = (event: React.KeyboardEvent) => {
    const indice = TABS.findIndex((t) => t.id === tab);
    let siguiente: number | null = null;
    if (event.key === 'ArrowRight') siguiente = (indice + 1) % TABS.length;
    if (event.key === 'ArrowLeft') siguiente = (indice - 1 + TABS.length) % TABS.length;
    if (siguiente == null) return;
    event.preventDefault();
    setTab(TABS[siguiente].id);
    document.getElementById(`tab-${TABS[siguiente].id}`)?.focus();
  };

  return (
    <DashboardLayout title="Productos" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        subtitle="Tu catálogo: productos con sus variantes (SKU), organizados por categorías y atributos."
        icon={<Package className="w-6 h-6 text-brand-600" />}
      />

      <div role="tablist" aria-label="Secciones del catálogo" onKeyDown={onKeyTab} className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const activo = tab === t.id;
          const count = t.id === 'productos' ? productosCount : t.id === 'categorias' ? categories.length : attributes.length;
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={activo}
              aria-controls={`panel-${t.id}`}
              tabIndex={activo ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                activo
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {t.label}
              <span
                aria-hidden
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activo ? 'bg-white text-brand-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === 'productos' && (
        <div role="tabpanel" id="panel-productos" aria-labelledby="tab-productos" tabIndex={0}>
          <GestionProductos
            products={products}
            categories={categories}
            attributes={attributes}
            loading={loading}
            loadError={loadError}
            onReload={loadCatalog}
            feedback={productosFeedback}
            onFeedback={setProductosFeedback}
          />
        </div>
      )}
      {tab === 'categorias' && (
        <div role="tabpanel" id="panel-categorias" aria-labelledby="tab-categorias" tabIndex={0}>
          <GestionCategorias
            categories={categories}
            products={products}
            loading={loading}
            loadError={loadError}
            onReload={loadCatalog}
            feedback={categoriasFeedback}
            onFeedback={setCategoriasFeedback}
          />
        </div>
      )}
      {tab === 'atributos' && (
        <div role="tabpanel" id="panel-atributos" aria-labelledby="tab-atributos" tabIndex={0}>
          <GestionAtributos
            attributes={attributes}
            loading={loading}
            loadError={loadError}
            onReload={loadCatalog}
            feedback={atributosFeedback}
            onFeedback={setAtributosFeedback}
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default Productos;
