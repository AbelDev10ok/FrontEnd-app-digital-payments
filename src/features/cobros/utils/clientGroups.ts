import type { CuotaItem } from '@/shared/types/business';

/** A client's collectable fees in one currency, as shown in the agenda. */
export interface ClientGroup {
  /** Stable key: client + currency. */
  key: string;
  clientId: number;
  clientName: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  currency: string;
  items: CuotaItem[];
  /**
   * Amount collectable today: per operation, the sum of its fees is capped by
   * the operation debt (`deudaVenta`); operations are then added up.
   */
  subtotal: number;
  /**
   * Debt of the client in this currency, or null when any of the group's
   * operations does not report `deudaVenta` (the modal hides it then).
   */
  debt: number | null;
}

/**
 * Collectable subtotal of a set of fees of the same client and currency:
 * per operation, `min(sum of its fees, deudaVenta)`, then summed across
 * operations. Fees already paid are not collectable and are left out; without
 * an informed debt there is nothing to cap.
 */
export const collectableSubtotal = (cuotas: CuotaItem[]): number => {
  const byOperation = new Map<number, { sum: number; debt: number | null }>();
  for (const cuota of cuotas) {
    const operation = byOperation.get(cuota.saleId) ?? { sum: 0, debt: null };
    if (!cuota.pagada) {
      operation.sum += cuota.monto ?? 0;
    }
    if (operation.debt == null && cuota.deudaVenta != null) {
      operation.debt = cuota.deudaVenta;
    }
    byOperation.set(cuota.saleId, operation);
  }

  let subtotal = 0;
  for (const { sum, debt } of byOperation.values()) {
    subtotal += debt == null ? sum : Math.min(sum, Math.max(debt, 0));
  }
  return subtotal;
};

/** Debt in the currency, or null when an operation does not report it. */
const groupDebt = (cuotas: CuotaItem[]): number | null => {
  const byOperation = new Map<number, number | null>();
  for (const cuota of cuotas) {
    if (!byOperation.has(cuota.saleId)) {
      byOperation.set(cuota.saleId, cuota.deudaVenta ?? null);
    }
  }

  let debt = 0;
  for (const operationDebt of byOperation.values()) {
    if (operationDebt == null) {
      return null;
    }
    debt += Math.max(operationDebt, 0);
  }
  return debt;
};

/**
 * Groups the agenda by client and currency, keeping the order of the agenda
 * (oldest due fee first). Currencies are never summed: one client with debt in
 * two currencies becomes two groups.
 */
export const groupByClientAndCurrency = (cuotas: CuotaItem[]): ClientGroup[] => {
  const groups = new Map<string, ClientGroup>();
  for (const cuota of cuotas) {
    const currency = cuota.currency ?? '';
    const key = `${cuota.clientId}:${currency}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        clientId: cuota.clientId,
        clientName: cuota.clientName,
        clientPhone: cuota.clientPhone,
        clientAddress: cuota.clientAddress,
        currency,
        items: [],
        subtotal: 0,
        debt: null,
      };
      groups.set(key, group);
    }
    // The header uses the first client data available in the group.
    group.clientPhone ??= cuota.clientPhone;
    group.clientAddress ??= cuota.clientAddress;
    group.items.push(cuota);
  }

  for (const group of groups.values()) {
    group.subtotal = collectableSubtotal(group.items);
    group.debt = groupDebt(group.items);
  }

  return [...groups.values()];
};
