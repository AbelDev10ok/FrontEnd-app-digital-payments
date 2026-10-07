import { useState } from "react";
import { Package, Search, X, Minus, Plus } from "lucide-react";
import { Button, Input } from "@/shared/components/ui";
import type { ProductDto, ProductTypeDto } from "@/shared/types/sales";
import { formatCurrency } from "@/shared/utils/formatCurrency";

interface ProductPickerProps {
  products: ProductDto[];
  productTypes: ProductTypeDto[];
  onSelect: (product: ProductDto, cantidad: number) => void;
}

const ProductPicker: React.FC<ProductPickerProps> = ({ products, productTypes, onSelect }) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const filtered = products.filter((p) => {
    if (selectedCategory && String(p.productTypeId) !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const onSearchChange = (value: string) => setSearch(value);

  const select = (p: ProductDto) => {
    setSelectedProduct(p);
    setCantidad(1);
  };

  const adjustCantidad = (delta: number) => {
    const next = cantidad + delta;
    if (next >= 1) setCantidad(next);
  };

  const precioTotal = selectedProduct?.price != null ? selectedProduct.price * cantidad : 0;

  return (
    <div className="bg-white rounded-card shadow-card border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Elegir producto
      </h3>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No hay productos registrados</p>
          <p className="text-sm text-gray-400 mb-4">
            Creá tus productos en el catálogo antes de empezar a vender.
          </p>
          <Button variant="secondary" onClick={() => window.location.href = "/dashboard/productos"}>
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
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de categorías */}
          {productTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === null ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todas
              </button>
              {productTypes.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === String(cat.id) ? null : String(cat.id))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === String(cat.id) ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No se encontraron productos con esos filtros.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filtered.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                const noPrice = p.price == null || p.price <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={noPrice}
                    onClick={() => !noPrice && select(p)}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-brand-50 border-brand-400 ring-2 ring-brand-400"
                        : "bg-white border-gray-200 hover:bg-brand-50/40 hover:border-brand-200"
                    } ${noPrice ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {noPrice && (
                      <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Sin precio
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <Package className="w-6 h-6 text-brand-600" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.price != null ? formatCurrency(p.price) : "—"}
                          {p.productTypeName ? ` · ${p.productTypeName}` : ""}
                        </p>
                      </div>
                    </div>
                    {p.stock != null && (
                      <p className="mt-1 text-xs text-gray-400">Stock: {p.stock}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Barra inferior: producto seleccionado + cantidad */}
      {selectedProduct && (
        <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-brand-600" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(selectedProduct.price ?? 0)} por unidad
                  {selectedProduct.stock != null ? ` · Stock: ${selectedProduct.stock}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => adjustCantidad(-1)}
                  aria-label="Disminuir cantidad"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={String(cantidad)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isInteger(v) && v >= 1) setCantidad(v);
                  }}
                  className="w-16 text-center"
                />
                <button
                  type="button"
                  onClick={() => adjustCantidad(1)}
                  aria-label="Aumentar cantidad"
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-semibold text-brand-700 font-mono tabular-nums">
                  {formatCurrency(precioTotal)}
                </p>
              </div>

              <Button onClick={() => onSelect(selectedProduct, cantidad)}>
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
