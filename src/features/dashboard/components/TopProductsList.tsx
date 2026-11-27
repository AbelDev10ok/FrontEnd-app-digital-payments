import { formatCurrency, formatMoneyByCurrency } from "@/shared/utils/formatCurrency";
import type { TopProduct } from "@/shared/types/dashboard";

interface TopProductsListProps {
  products: TopProduct[];
}

const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aún no hay productos vendidos este mes.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {products.map((product, index) => (
        <li
          key={product.productId}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {product.productName}
              </p>
              <p className="text-xs text-gray-500">
                {product.unidades} {product.unidades === 1 ? "unidad" : "unidades"} ·{" "}
                {product.totalVentas} {product.totalVentas === 1 ? "venta" : "ventas"}
              </p>
            </div>
          </div>
          <p className="font-semibold text-gray-900 font-mono tabular-nums shrink-0">
            {formatMoneyByCurrency(product.totalVendido) || formatCurrency(0)}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default TopProductsList;
