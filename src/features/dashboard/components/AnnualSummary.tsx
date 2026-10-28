import type { DashboardAnual } from "@/shared/types/dashboard";
import { formatCurrency, formatMoneyByCurrency } from "@/shared/utils/formatCurrency";

interface AnnualSummaryProps {
  anual: DashboardAnual;
}

const AnnualSummary: React.FC<AnnualSummaryProps> = ({ anual }) => {
  const items = [
    { label: "Ventas", value: String(anual.totalVentas) },
    { label: "Vendido", value: formatMoneyByCurrency(anual.totalVendido) || formatCurrency(0) },
    { label: "Cobrado", value: formatMoneyByCurrency(anual.totalCobrado) || formatCurrency(0) },
    { label: "Ganancia esperada", value: formatMoneyByCurrency(anual.ganancia) || formatCurrency(0) },
  ];

  return (
    // 2×2 fijo: con 4 columnas los montos se cortaban dentro de la tarjeta
    // (el ancho disponible depende de la grilla externa, no del contenido).
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-gray-500">{item.label}</p>
          <p className="text-lg font-bold text-gray-900 font-mono tabular-nums break-words">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AnnualSummary;
