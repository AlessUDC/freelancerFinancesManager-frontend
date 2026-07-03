/**
 * lib/dates.ts
 * Utilidades centralizadas para manejo de fechas en UTC / zona local.
 * Regla de oro: almacenar en UTC, mostrar en el timezone del usuario.
 */

/**
 * Formatea una fecha ISO (UTC) a la zona horaria del navegador.
 * Reemplaza el antipatrón `new Date(fecha + 'T00:00:00')` usado antes.
 */
export function formatLocalDate(
  isoDate: string,
  locale = 'es-MX',
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  if (!isoDate) return '—';
  // Si ya viene como YYYY-MM-DD (sin hora), parseamos como medianoche UTC
  const normalized = isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`;
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(normalized));
}

/**
 * Devuelve el timezone detectado del navegador.
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Calcula la próxima fecha de renovación de una suscripción.
 * Regla: si el día de facturación > último día del mes destino,
 * se mueve al último día de ese mes (ej. 31 de enero → 28 de febrero).
 */
export function nextRenewalDate(from: Date, ciclo: 'MENSUAL' | 'ANUAL'): Date {
  const result = new Date(from);
  const originalDay = from.getDate();

  if (ciclo === 'MENSUAL') {
    result.setMonth(result.getMonth() + 1);
  } else {
    result.setFullYear(result.getFullYear() + 1);
  }

  // Ajuste al último día del mes si el mes destino es más corto
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  if (originalDay > lastDayOfMonth) {
    result.setDate(lastDayOfMonth);
  }

  return result;
}

/**
 * Calcula días restantes hasta una fecha (positivo = futuro, negativo = pasado).
 */
export function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna badge metadata según los días restantes para una renovación.
 */
export function renewalBadge(isoDate: string): { label: string; color: string } {
  const days = daysUntil(isoDate);
  if (days <= 3) return { label: `${days}d`, color: 'bg-red-100 text-red-700' };
  if (days <= 7) return { label: `${days}d`, color: 'bg-yellow-100 text-yellow-700' };
  return { label: `${days}d`, color: 'bg-gray-100 text-gray-600' };
}

/**
 * Convierte fecha local YYYY-MM-DD a string ISO para envío al backend.
 */
export function toIsoDate(localDate: string): string {
  if (!localDate) return '';
  return new Date(`${localDate}T00:00:00`).toISOString();
}

export type TimeFilter = 'DIA' | 'SEMANA' | 'MES' | 'AÑO' | 'TODOS';

/**
 * Verifica si una fecha en string YYYY-MM-DD pertenece al filtro de tiempo respecto a hoy.
 */
export function isWithinTimeFilter(isoDate: string | undefined | null, filter: TimeFilter): boolean {
  if (!isoDate) return false;
  if (filter === 'TODOS') return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00Z`);
  target.setHours(0, 0, 0, 0);

  if (filter === 'DIA') {
    return target.getTime() === today.getTime();
  }
  if (filter === 'SEMANA') {
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(diff) <= 7;
  }
  if (filter === 'MES') {
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  }
  if (filter === 'AÑO') {
    return target.getFullYear() === today.getFullYear();
  }

  return false;
}
