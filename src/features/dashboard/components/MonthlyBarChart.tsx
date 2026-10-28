import { useState } from "react";
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

interface MonthlyBarChartProps {
  series: MonthlySales[];
}

const etiquetaMes = (m: MonthlySales) => `${MESES_CORTOS[m.month - 1]} ${m.year}`;
const claveDeMes = (m: MonthlySales) => `${m.year}-${m.month}`;

/**
 * Barras de un mes a otro para UNA sola moneda (los ejes no mezclan monedas).
 *
 * Cada mes es un botón: en táctil no hay hover, así que los valores del mes
 * elegido se muestran en una línea debajo del gráfico (`caption`) y el mes
 * activo queda resaltado. Los `title` siguen disponibles para el mouse.
 */
const SeriePorMoneda: React.FC<{
  series: MonthlySales[];
  moneda?: string;
  seleccionado: string | null;
  onSeleccionar: (clave: string) => void;
}> = ({ series, moneda, seleccionado, onSeleccionar }) => {
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

  // El mes por defecto es el último de la serie (el período consultado); si
  // la selección guardada ya no está en la serie, también cae al último.
  const mesActivo =
    series.find((m) => claveDeMes(m) === seleccionado) ?? series[series.length - 1];

  return (
    <div>
      <div className="flex items-end gap-2">
        {series.map((m) => {
          const activo = claveDeMes(m) === claveDeMes(mesActivo);
          const vendido = monto(m, "vendido");
          const cobrado = monto(m, "cobrado");
          const ganancia = moneda ? (m.ganancia[moneda] ?? 0) : 0;
          return (
            <button
              key={claveDeMes(m)}
              type="button"
              onClick={() => onSeleccionar(claveDeMes(m))}
              aria-pressed={activo}
              aria-label={`${etiquetaMes(m)}: vendido ${formatCurrency(vendido, moneda)}, cobrado ${formatCurrency(cobrado, moneda)}`}
              className={`group flex-1 min-w-0 flex flex-col items-center gap-1 rounded-lg pt-1 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                activo ? "bg-brand-50" : "hover:bg-gray-50"
              }`}
            >
              <span className="flex items-end gap-0.5 w-full justify-center h-28 sm:h-36">
                <span
                  className="w-1/2 max-w-[14px] rounded-t-sm bg-brand-500 group-hover:bg-brand-600 transition-colors"
                  style={{
                    height: vendido > 0
                      ? `max(2px, ${(vendido / max) * 100}%)`
                      : 0,
                  }}
                  title={`Vendido ${etiquetaMes(m)}: ${formatCurrency(vendido, moneda)} · Ganancia Esperada: ${formatCurrency(ganancia, moneda)}`}
                />
                <span
                  className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-300 group-hover:bg-emerald-400 transition-colors"
                  style={{
                    height: cobrado > 0
                      ? `max(2px, ${(cobrado / max) * 100}%)`
                      : 0,
                  }}
                  title={`Cobrado ${etiquetaMes(m)}: ${formatCurrency(cobrado, moneda)}`}
                />
              </span>
              <span className={`text-[11px] ${activo ? "text-brand-700 font-semibold" : "text-gray-500"}`}>
                {MESES_CORTOS[m.month - 1]}
              </span>
            </button>
          );
        })}
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
      <p className="mt-2 text-xs text-gray-600" aria-live="polite">
        {etiquetaMes(mesActivo)} · Vendido {formatCurrency(monto(mesActivo, "vendido"), moneda)} · Cobrado{" "}
        {formatCurrency(monto(mesActivo, "cobrado"), moneda)}
      </p>
    </div>
  );
};

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ series }) => {
  // Mes elegido a mano (clave "año-mes"); sin elección, cada bloque usa el
  // último mes de la serie. El estado vive acá para que, con varias monedas,
  // el mismo mes quede marcado en todos los bloques.
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

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
            <SeriePorMoneda
              series={series}
              moneda={moneda}
              seleccionado={seleccionado}
              onSeleccionar={setSeleccionado}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <SeriePorMoneda
      series={series}
      moneda={monedas[0]}
      seleccionado={seleccionado}
      onSeleccionar={setSeleccionado}
    />
  );
};

export default MonthlyBarChart;
