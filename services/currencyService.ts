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
  EUR: 0.87,
  PEN: 3.42,
  MXN: 17.47,
  COP: 3359.84,
  ARS: 1492.90,
  CLP: 925.62,
};

/**
 * Obtiene tasas de cambio para una moneda base calculadas
 * a partir de un diccionario estático basado en USD.
 */
export async function fetchRates(base = 'USD'): Promise<ExchangeRates> {
  if (typeof window === 'undefined') {
    return { base, date: '', rates: {} };
  }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (response.ok) {
      const data = await response.json();
      if (data.result === 'success' && data.rates) {
        return {
          base: data.base_code || base,
          date: data.time_last_update_utc || new Date().toISOString(),
          rates: data.rates,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching exchange rates, falling back to static rates:', error);
  }

  // Fallback to static dictionary
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
