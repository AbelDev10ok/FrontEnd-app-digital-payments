import type { DashboardAnual } from "@/shared/types/dashboard";
import { formatCurrency } from "@/shared/utils/formatCurrency";

interface AnnualSummaryProps {
  anual: DashboardAnual;
}

const AnnualSummary: React.FC<AnnualSummaryProps> = ({ anual }) => {
  const items = [
    { label: "Ventas", value: String(anual.totalVentas) },
    { label: "Vendido", value: formatCurrency(anual.totalVendido) },
    { label: "Cobrado", value: formatCurrency(anual.totalCobrado) },
    { label: "Ganancia Esperada", value: formatCurrency(anual.ganancia) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-gray-500">{item.label}</p>
          <p className="text-lg font-bold text-gray-900 font-mono tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AnnualSummary;
