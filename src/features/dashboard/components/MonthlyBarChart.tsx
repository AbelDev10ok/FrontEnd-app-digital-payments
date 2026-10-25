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

/** Barras de un mes a otro para UNA sola moneda (los ejes no mezclan monedas). */
const SeriePorMoneda: React.FC<{ series: MonthlySales[]; moneda?: string }> = ({
  series,
  moneda,
}) => {
  const monto = (m: MonthlySales, campo: "vendido" | "cobrado") =>
    (moneda ? (m[campo][moneda] ?? 0) : 0);

  const max = Math.max(
    ...series.map((m) => Math.max(monto(m, "vendido"), monto(m, "cobrado"))),
    1,
  );

  // Sin movimientos no se dibujan barras: una barra mínima en un mes en 0
  // parecería un monto chico en vez de nada
  const hayDatos = series.some((m) => monto(m, "vendido") > 0 || monto(m, "cobrado") > 0);
  if (!hayDatos) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        Sin movimientos en este período.
      </p>
    );
  }

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
                  height: monto(m, "vendido") > 0
                    ? `${Math.max((monto(m, "vendido") / max) * BAR_AREA_HEIGHT, 2)}px`
                    : 0,
                }}
                title={`Vendido ${MESES_CORTOS[m.month - 1]} ${m.year}: ${formatCurrency(monto(m, "vendido"), moneda)} · Ganancia Esperada: ${formatCurrency(moneda ? (m.ganancia[moneda] ?? 0) : 0, moneda)}`}
              />
              <div
                className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-300 hover:bg-emerald-400 transition-colors"
                style={{
                  height: monto(m, "cobrado") > 0
                    ? `${Math.max((monto(m, "cobrado") / max) * BAR_AREA_HEIGHT, 2)}px`
                    : 0,
                }}
                title={`Cobrado ${MESES_CORTOS[m.month - 1]} ${m.year}: ${formatCurrency(monto(m, "cobrado"), moneda)}`}
              />
            </div>
            <span className="text-[11px] text-gray-500">
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

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ series }) => {
  // Monedas presentes en la serie. Con una sola moneda se dibuja el gráfico
  // actual; con varias se dibuja UNO POR MONEDA, porque montos de monedas
  // distintas no se comparan ni se suman en el mismo eje.
  const monedas = [...new Set(
    series.flatMap((m) => [
      ...Object.keys(m.vendido ?? {}),
      ...Object.keys(m.cobrado ?? {}),
    ]),
  )].sort();

  if (monedas.length > 1) {
    return (
      <div className="space-y-6">
        {monedas.map((moneda) => (
          <div key={moneda}>
            <p className="text-xs font-semibold text-gray-500 mb-2">{moneda}</p>
            <SeriePorMoneda series={series} moneda={moneda} />
          </div>
        ))}
      </div>
    );
  }

  return <SeriePorMoneda series={series} moneda={monedas[0]} />;
};

export default MonthlyBarChart;
