import { formatCurrency, formatMoneyByCurrency } from "@/shared/utils/formatCurrency";
import type { CategorySales } from "@/shared/types/dashboard";

interface CategoryBreakdownListProps {
  categories: CategorySales[];
}

const CategoryBreakdownList: React.FC<CategoryBreakdownListProps> = ({ categories }) => {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-gray-500">Sin ventas de productos este mes.</p>
    );
  }

  return (
    <ul className="space-y-4">
      {categories.map((category) => (
        <li
          key={category.categoryId ?? "sin-categoria"}
          className="flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {category.categoryName}
            </p>
            <p className="text-xs text-gray-500">
              {category.totalVentas} {category.totalVentas === 1 ? "venta" : "ventas"} ·{" "}
              {category.unidades} {category.unidades === 1 ? "unidad" : "unidades"}
            </p>
          </div>
          <p className="font-semibold text-gray-900 font-mono tabular-nums shrink-0">
            {formatMoneyByCurrency(category.totalVendido) || formatCurrency(0)}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default CategoryBreakdownList;
