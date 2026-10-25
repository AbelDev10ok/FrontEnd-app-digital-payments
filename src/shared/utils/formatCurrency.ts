import { businessService } from "@/features/negocio/services/businessService";
import type { MontosPorMoneda } from "@/shared/types/money";

let currentCurrency = "ARS";
let loadPromise: Promise<void> | null = null;

export function getCurrency(): string {
  return currentCurrency;
}

/** Símbolo real de la moneda (es-AR): '$' ARS, 'US$' USD, '₲' PYG. */
export function getCurrencySymbol(currency: string = currentCurrency): string {
  try {
    const parts = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

/**
 * Carga una sola vez la moneda configurada del negocio (single-flight).
 * Si falla (sin sesión, backend caído) mantiene ARS y permite reintentar.
 */
export function initCurrency(): Promise<void> {
  if (!loadPromise) {
    loadPromise = businessService
      .getMyBusiness()
      .then((biz) => {
        currentCurrency = (biz.currency || "ARS").toUpperCase();
      })
      .catch(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

/** Aplica la moneda sin refetch (para actualizar al instante tras guardar Mi Negocio). */
export function applyCurrency(currency: string): void {
  currentCurrency = (currency || "ARS").toUpperCase();
}

export function formatCurrency(amount: number, currency: string = currentCurrency) {
  try {
    // Montos entre -1 y 1 (excluyendo 0) se muestran con decimales: evita que
    // saldos de centavos (p.ej. 0.08) parezcan "gratis"/$0 tras redondear.
    const showDecimals = amount !== 0 && Math.abs(amount) < 1;
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  } catch {
    // Fallback
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Formatea montos agregados por moneda como "ARS 150.000 · USD 320".
 * Nunca suma monedas distintas: cada monto se muestra con su propia moneda.
 */
export function formatMoneyByCurrency(montos?: MontosPorMoneda | null): string {
  if (!montos) return "";
  return Object.entries(montos)
    .filter(([, monto]) => monto != null)
    .map(([moneda, monto]) => formatCurrency(monto, moneda))
    .join(" · ");
}

/** ¿Hay algún monto cargado en el agregado por moneda? */
export function hasMoney(montos?: MontosPorMoneda | null): boolean {
  return !!montos && Object.keys(montos).length > 0;
}

/** Suma por moneda de varios agregados (solo acumula dentro de cada moneda). */
export function mergeMoney(...conjuntos: Array<MontosPorMoneda | null | undefined>): MontosPorMoneda {
  const total: MontosPorMoneda = {};
  for (const conjunto of conjuntos) {
    if (!conjunto) continue;
    for (const [moneda, monto] of Object.entries(conjunto)) {
      if (monto == null) continue;
      total[moneda] = (total[moneda] ?? 0) + monto;
    }
  }
  return total;
}

export default formatCurrency;