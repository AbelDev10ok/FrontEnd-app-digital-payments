export function formatCurrency(amount: number, currency = 'ARS') {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (err) {
    // Fallback
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default formatCurrency;
