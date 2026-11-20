export function formatMoney(amount: string | number, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    // Fallback for a currency code Intl doesn't recognize.
    return `${currency} ${value.toLocaleString()}`;
  }
}
