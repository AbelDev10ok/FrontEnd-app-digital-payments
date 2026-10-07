import { businessService } from "@/features/negocio/services/businessService";

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

export default formatCurrency;