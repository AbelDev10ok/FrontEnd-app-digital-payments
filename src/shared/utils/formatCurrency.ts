export function formatCurrency(amount: number, locale = 'es-AR', currency = 'ARS'): string {
  // Safety: ensure a number is passed
  const value = Number(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

export default formatCurrency;
