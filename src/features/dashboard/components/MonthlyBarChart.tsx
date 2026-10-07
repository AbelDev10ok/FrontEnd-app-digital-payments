import { formatCurrency } from "@/shared/utils/formatCurrency";
import type { MonthlySales } from "@/shared/types/dashboard";

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const BAR_AREA_HEIGHT = 144;

interface MonthlyBarChartProps {
  series: MonthlySales[];
}

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ series }) => {
  const max = Math.max(...series.map((m) => Math.max(m.vendido, m.cobrado)), 1);

  return (
    <div>
      <div className="flex items-end gap-2">
        {series.map((m) => (
          <div
            key={`${m.year}-${m.month}`}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <div className="flex items-end gap-0.5 w-full justify-center">
              <div
                className="w-1/2 max-w-[14px] rounded-t-sm bg-brand-500 hover:bg-brand-600 transition-colors"
                style={{
                  height: `${Math.max((m.vendido / max) * BAR_AREA_HEIGHT, 2)}px`,
                }}
                title={`Vendido ${MESES_CORTOS[m.month - 1]} ${m.year}: ${formatCurrency(m.vendido)} · Ganancia Esperada: ${formatCurrency(m.ganancia)}`}
              />
              <div
                className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-300 hover:bg-emerald-400 transition-colors"
                style={{
                  height: `${Math.max((m.cobrado / max) * BAR_AREA_HEIGHT, 2)}px`,
                }}
                title={`Cobrado ${MESES_CORTOS[m.month - 1]} ${m.year}: ${formatCurrency(m.cobrado)}`}
              />
            </div>
            <span className="text-[10px] text-gray-500">
              {MESES_CORTOS[m.month - 1]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
          <span className="text-xs text-gray-500">Vendido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-300" />
          <span className="text-xs text-gray-500">Cobrado</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBarChart;
