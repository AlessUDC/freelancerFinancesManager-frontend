/**
 * services/currencyService.ts
 * Implementación de diccionario estático de tipos de cambio.
 */

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const STATIC_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  PEN: 3.75,
  MXN: 17.5,
  COP: 3900.0,
  ARS: 850.0,
  CLP: 950.0,
};

/**
 * Obtiene tasas de cambio para una moneda base calculadas
 * a partir de un diccionario estático basado en USD.
 */
export async function fetchRates(base = 'USD'): Promise<ExchangeRates> {
  if (typeof window === 'undefined') {
    return { base, date: '', rates: {} };
  }

  const baseRate = STATIC_RATES[base] || 1.0;
  const rates: Record<string, number> = {};

  for (const [currency, rate] of Object.entries(STATIC_RATES)) {
    rates[currency] = rate / baseRate;
  }

  return {
    base,
    date: new Date().toISOString(),
    rates,
  };
}

/**
 * Convierte un monto de `from` a `to` usando las tasas precargadas.
 * Si no hay tasa disponible, devuelve el monto original.
 */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to || !rates[from] || !rates[to]) return amount;
  // Tasas relativas a la base: amount / rates[from] * rates[to]
  const inBase = amount / (rates[from] ?? 1);
  return inBase * (rates[to] ?? 1);
}

/**
 * Formatea un monto con su símbolo y moneda.
 */
export function fmtWithCurrency(
  amount: number,
  currencyCode: string,
  locale = 'es-MX'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
