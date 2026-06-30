/**
 * services/currencyService.ts
 * Tipo de cambio en tiempo real usando frankfurter.app (gratis, sin API key).
 * Documentación: https://frankfurter.app/
 */

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 horas

interface CacheEntry {
  timestamp: number;
  data: ExchangeRates;
}

/**
 * Obtiene tasas de cambio para una moneda base.
 * Usa caché en localStorage (TTL = 4 horas) para no saturar la API.
 */
export async function fetchRates(base = 'USD'): Promise<ExchangeRates> {
  if (typeof window === 'undefined') {
    return { base, date: '', rates: {} };
  }

  const cacheKey = `${CACHE_KEY}_${base}`;
  const raw = localStorage.getItem(cacheKey);
  if (raw) {
    try {
      const cached: CacheEntry = JSON.parse(raw);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    } catch {
      // caché corrupta, ignorar
    }
  }

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?base=${base}`
    );
    if (!res.ok) throw new Error('API error');
    const data: ExchangeRates = await res.json();
    // Frankfurter no incluye la moneda base en "rates", agregarla
    data.rates[base] = 1;

    const entry: CacheEntry = { timestamp: Date.now(), data };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    return data;
  } catch {
    // Si la API falla, devolver tasas vacías (sin conversión)
    console.warn('[currencyService] No se pudo obtener tipo de cambio. Usando 1:1');
    return { base, date: '', rates: { [base]: 1 } };
  }
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
  // Si la base es from, simplemente multiplicamos por rates[to]
  // Si la base no es from, necesitamos normalizar
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
