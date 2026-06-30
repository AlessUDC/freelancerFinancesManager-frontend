/**
 * lib/currency.ts
 * Utilidades para formateo de moneda.
 * Multidivisa real (API de tipo de cambio) queda pendiente para siguiente iteración.
 */

export const MONEDAS_DISPONIBLES = [
  { code: 'USD', label: 'USD — Dólar americano', symbol: '$' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'MXN', label: 'MXN — Peso mexicano', symbol: '$' },
  { code: 'COP', label: 'COP — Peso colombiano', symbol: '$' },
  { code: 'ARS', label: 'ARS — Peso argentino', symbol: '$' },
  { code: 'PEN', label: 'PEN — Sol peruano', symbol: 'S/' },
  { code: 'CLP', label: 'CLP — Peso chileno', symbol: '$' },
  { code: 'BRL', label: 'BRL — Real brasileño', symbol: 'R$' },
];

/**
 * Formatea un número como moneda usando Intl.NumberFormat.
 */
export function formatCurrency(
  amount: number,
  currencyCode = 'USD',
  locale = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número simple como moneda local (sin código ISO).
 * Versión rápida para tablas.
 */
export function fmt(n: number): string {
  return '$' + (n ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Devuelve el símbolo de una moneda.
 */
export function getCurrencySymbol(code: string): string {
  return MONEDAS_DISPONIBLES.find((m) => m.code === code)?.symbol ?? '$';
}
