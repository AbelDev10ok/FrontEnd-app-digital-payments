import { useState } from "react";
import { ChevronDown, Package, Search, X, Minus, Plus } from "lucide-react";
import { Button, Input } from "@/shared/components/ui";
import type { ProductDto, ProductTypeDto } from "@/shared/types/sales";
import { formatCurrency } from "@/shared/utils/formatCurrency";
import { especificacionesDe } from "@/shared/utils/productSpecs";
import {
  agruparCategoriasPorPadre,
  categoriaYDescendientes,
} from "@/shared/utils/categoryTree";

interface ProductPickerProps {
  products: ProductDto[];
  productTypes: ProductTypeDto[];
  onSelect: (product: ProductDto, cantidad: number) => void;
  /** Variante ya elegida y su cantidad, al volver del detalle con "Cambiar". */
  initialVariantId?: string | number | null;
  initialCantidad?: number | null;
}

/**
 * Badge de costo y ganancia de la venta que se está armando (cantidad incluida).
 * El costo sale del catálogo y la ganancia es precio de venta − costo.
 */
const CostoYGanancia: React.FC<{
  cost?: number | null;
  price?: number | null;
  cantidad: number;
  currency?: string | null;
}> = ({ cost, price, cantidad, currency }) => {
  if (cost == null) return null;
  const costo = cost * cantidad;
  const ganancia = price != null ? (price - cost) * cantidad : null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
        Costo {formatCurrency(costo, currency ?? undefined)}
      </span>
      {ganancia != null && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            ganancia >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          Ganancia {formatCurrency(ganancia, currency ?? undefined)}
        </span>
      )}
    </div>
  );
};

const ProductPicker: React.FC<ProductPickerProps> = ({
  products,
  productTypes,
  onSelect,
  initialVariantId = null,
  initialCantidad = null,
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(() => {
    if (initialVariantId == null || initialVariantId === "") return null;
    return (
      products.find(
        (p) => String(p.variantId ?? p.id) === String(initialVariantId),
      ) ?? null
    );
  });
  const [cantidad, setCantidad] = useState(() => {
    const inicial = Math.floor(Number(initialCantidad));
    return Number.isInteger(inicial) && inicial >= 1 ? inicial : 1;
  });

  const categoriesByParent = agruparCategoriasPorPadre(productTypes);
  const categoryAndDescendantIds =
    selectedCategory != null
      ? categoriaYDescendientes(productTypes, selectedCategory)
      : new Set<number>();

  const filtered = products.filter((p) => {
    if (
      selectedCategory != null &&
      (p.productTypeId == null ||
        !categoryAndDescendantIds.has(p.productTypeId))
    )
      return false;
    if (search) {
      const q = search.toLowerCase();
      // Los atributos también buscan ("ram", "rojo", "4 gb").
      const haystack = [p.name, p.sku, ...especificacionesDe(p)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const onSearchChange = (value: string) => setSearch(value);

  const select = (p: ProductDto) => {
    setSelectedProduct(p);
    setCantidad(1);
  };

  const stockDisponible = (p: ProductDto | null) =>
    p?.stock != null ? p.stock : Number.POSITIVE_INFINITY;

  const adjustCantidad = (delta: number) => {
    const next = cantidad + delta;
    if (next >= 1 && next <= stockDisponible(selectedProduct))
      setCantidad(next);
  };

  const toggleCategory = (category: ProductTypeDto, hasChildren: boolean) => {
    setSelectedCategory(category.id);
    if (!hasChildren) return;

    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category.id)) next.delete(category.id);
      else next.add(category.id);
      return next;
    });
  };

  const renderCategory = (category: ProductTypeDto): React.ReactNode => {
    const children = categoriesByParent.get(category.id) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id} className="min-w-0">
        <button
          type="button"
          onClick={() => toggleCategory(category, hasChildren)}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-controls={hasChildren ? `category-children-${category.id}` : undefined}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isSelected
              ? "bg-action text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {category.name}
          {hasChildren && (
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
        {hasChildren && isExpanded && (
          <div
            id={`category-children-${category.id}`}
            className="ml-3 mt-2 flex flex-wrap gap-2 border-l border-gray-200 pl-3"
          >
            {children.map(renderCategory)}
          </div>
        )}
      </div>
    );
  };

  const precioTotal =
    selectedProduct?.price != null ? selectedProduct.price * cantidad : 0;
  const specsSeleccion = selectedProduct
    ? especificacionesDe(selectedProduct)
    : [];

  return (
    <div className="bg-surface rounded-card shadow-card border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Elegir producto
      </h2>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">
            No hay productos registrados
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Creá tus productos en el catálogo antes de empezar a vender.
          </p>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = "/dashboard/productos")}
          >
            Ir al catálogo
          </Button>
        </div>
      ) : (
        <>
          {/* Buscador */}
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar producto…"
              className="pl-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de categorías */}
          {productTypes.length > 0 && (
            <div className="flex flex-wrap items-start gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-action text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              {(categoriesByParent.get(null) ?? []).map(renderCategory)}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No se encontraron productos con esos filtros.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filtered.map((p) => {
                const isSelected = selectedProduct?.variantId === p.variantId;
                const specs = especificacionesDe(p);
                const noPrice = p.price == null || p.price <= 0;
                const sinStock = p.stock != null && p.stock <= 0;
                const inactivo = p.active === false;
                const noDisponible = noPrice || sinStock || inactivo;
                return (
                  <button
                    key={p.variantId ?? p.id}
                    type="button"
                    disabled={noDisponible}
                    onClick={() => !noDisponible && select(p)}
                    className={`relative p-4 rounded-xl border text-left transition-[background-color,border-color,box-shadow] duration-150 ease-out ${
                      isSelected
                        ? "bg-brand-50 border-brand-400 ring-2 ring-brand-400"
                        : "bg-surface border-gray-200 hover:bg-brand-50/40 hover:border-brand-200"
                    } ${noDisponible ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {noPrice && (
                      <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Sin precio
                      </span>
                    )}
                    {!noPrice && inactivo && (
                      <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                    {!noPrice && !inactivo && sinStock && (
                      <span className="absolute top-2 right-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Sin stock
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-brand-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {p.name}
                        </p>
                        {specs.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {specs.join(" · ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.price != null
                            ? formatCurrency(p.price, p.currency ?? undefined)
                            : "—"}
                          {p.productTypeName ? ` · ${p.productTypeName}` : ""}
                        </p>
                        {p.sku ? (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {p.sku}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <CostoYGanancia
                      cost={p.cost}
                      price={p.price}
                      cantidad={cantidad}
                      currency={p.currency}
                    />
                    {p.stock != null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Stock: {p.stock}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Barra inferior: producto seleccionado + cantidad.
          En móvil se apila (producto / stepper + total / botón a lo ancho): en
          una sola fila el contenido empujaba "Continuar" fuera de la tarjeta. */}
      {selectedProduct && (
        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-surface border-t border-gray-200 rounded-b-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Package className="w-6 h-6 shrink-0 text-brand-600" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-gray-900 truncate">
                  {selectedProduct.name}
                </p>
                {specsSeleccion.length > 0 && (
                  <p className="text-xs text-gray-500 truncate">
                    {specsSeleccion.join(" · ")}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {formatCurrency(
                    selectedProduct.price ?? 0,
                    selectedProduct.currency ?? undefined,
                  )}{" "}
                  por unidad
                  {selectedProduct.stock != null
                    ? ` · Stock: ${selectedProduct.stock}`
                    : ""}
                </p>
                <CostoYGanancia
                  cost={selectedProduct.cost}
                  price={selectedProduct.price}
                  cantidad={cantidad}
                  currency={selectedProduct.currency}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center justify-between gap-4 sm:justify-start">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustCantidad(-1)}
                    aria-label="Disminuir cantidad"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  {/* El ancho vive en el contenedor: el `w-full` del input base
                      gana sobre cualquier `w-*` y se comía los botones. */}
                  <div className="w-16 shrink-0">
                    <Input
                      type="number"
                      min="1"
                      max={
                        selectedProduct.stock != null
                          ? selectedProduct.stock
                          : undefined
                      }
                      step="1"
                      value={String(cantidad)}
                      // El step no tiene label visible: sin nombre, el lector
                      // anuncia sólo "número" y los botones dicen cantidad de qué
                      aria-label="Cantidad"
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (
                          Number.isInteger(v) &&
                          v >= 1 &&
                          v <= stockDisponible(selectedProduct)
                        )
                          setCantidad(v);
                      }}
                      className="h-10 text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustCantidad(1)}
                    aria-label="Aumentar cantidad"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-semibold text-brand-700 font-mono tabular-nums">
                    {formatCurrency(
                      precioTotal,
                      selectedProduct.currency ?? undefined,
                    )}
                  </p>
                </div>
              </div>

              <Button
                className="w-full sm:w-auto"
                onClick={() => onSelect(selectedProduct, cantidad)}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPicker;
