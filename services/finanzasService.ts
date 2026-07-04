import { Ingreso, Gasto, Suscripcion } from '@/types';
import { nextRenewalDate } from '@/lib/dates';

// ── Ingresos ──────────────────────────────────────────────────
export const ingresosService = {
  getAll(): Ingreso[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('ingresos') || '[]');
  },
  save(list: Ingreso[]): void {
    localStorage.setItem('ingresos', JSON.stringify(list));
  },
  add(item: Omit<Ingreso, 'id'>): void {
    const list = ingresosService.getAll();
    list.unshift({ id: Date.now(), ...item });
    ingresosService.save(list);
  },
  remove(id: number): void {
    ingresosService.save(ingresosService.getAll().filter((i) => i.id !== id));
  },
  updateStatus(id: number, status: Ingreso['status']): void {
    const list = ingresosService.getAll().map((i) =>
      i.id === id ? { ...i, status } : i
    );
    ingresosService.save(list);
  },
  update(id: number, data: Partial<Omit<Ingreso, 'id'>>): void {
    const list = ingresosService.getAll().map((i) =>
      i.id === id ? { ...i, ...data } : i
    );
    ingresosService.save(list);
  },
  /** Solo suma ingresos PAGADOS (monto neto real) */
  totalPagado(): number {
    return ingresosService
      .getAll()
      .filter((i) => i.status === 'PAGADO')
      .reduce((s, i) => s + i.montoNeto, 0);
  },
  /** Suma todos los ingresos netos independiente del status */
  totalNeto(): number {
    return ingresosService.getAll().reduce((s, i) => s + i.montoNeto, 0);
  },
};

// ── Gastos ────────────────────────────────────────────────────
export const gastosService = {
  getAll(): Gasto[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('gastos') || '[]');
  },
  save(list: Gasto[]): void {
    localStorage.setItem('gastos', JSON.stringify(list));
  },
  add(item: Omit<Gasto, 'id'>): void {
    const list = gastosService.getAll();
    list.unshift({ id: Date.now(), ...item });
    gastosService.save(list);
  },
  remove(id: number): void {
    gastosService.save(gastosService.getAll().filter((g) => g.id !== id));
  },
  update(id: number, data: Partial<Omit<Gasto, 'id'>>): void {
    const list = gastosService.getAll().map((g) =>
      g.id === id ? { ...g, ...data } : g
    );
    gastosService.save(list);
  },
  total(): number {
    return gastosService.getAll().reduce((s, g) => s + g.monto, 0);
  },
  totalDeducible(): number {
    return gastosService
      .getAll()
      .filter((g) => g.esDeducible)
      .reduce((s, g) => s + g.monto, 0);
  },
  /** Gasto mensual fijo estimado (para calcular Runway) */
  gastoFijoMensual(): number {
    return gastosService
      .getAll()
      .filter((g) => g.esRecurrente)
      .reduce((s, g) => s + g.monto, 0);
  },
};

// ── Suscripciones ─────────────────────────────────────────────
export const suscripcionesService = {
  getAll(): Suscripcion[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('suscripciones') || '[]');
  },
  save(list: Suscripcion[]): void {
    localStorage.setItem('suscripciones', JSON.stringify(list));
  },
  add(item: Omit<Suscripcion, 'id'>): void {
    const list = suscripcionesService.getAll();
    list.unshift({ id: Date.now(), ...item });
    suscripcionesService.save(list);
  },
  remove(id: number): void {
    suscripcionesService.save(suscripcionesService.getAll().filter((s) => s.id !== id));
  },
  update(id: number, data: Partial<Omit<Suscripcion, 'id'>>): void {
    const list = suscripcionesService.getAll().map((s) =>
      s.id === id ? { ...s, ...data } : s
    );
    suscripcionesService.save(list);
  },

  toggleStatus(id: number): void {
    const list = suscripcionesService.getAll().map((s) =>
      s.id === id ? { ...s, status: s.status === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA' } as Suscripcion : s
    );
    suscripcionesService.save(list);
  },
  /** Costo mensual de todas las suscripciones activas (anuales divididas en 12) */
  costoMensualActivo(): number {
    return suscripcionesService
      .getAll()
      .filter((s) => s.status === 'ACTIVA')
      .reduce((sum, s) => sum + (s.ciclo === 'ANUAL' ? s.monto / 12 : s.monto), 0);
  },
  total(): number {
    return suscripcionesService
      .getAll()
      .filter((s) => s.status === 'ACTIVA')
      .reduce((s, i) => s + i.monto, 0);
  },
  /** Suscripciones que renuevan en los próximos `days` días */
  proximasRenovaciones(days = 7): Suscripcion[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    return suscripcionesService
      .getAll()
      .filter((s) => {
        if (!s.proximaRenovacion || s.status !== 'ACTIVA') return false;
        const fecha = new Date(s.proximaRenovacion + (s.proximaRenovacion.includes('T') ? '' : 'T00:00:00Z'));
        return fecha >= today && fecha <= limit;
      })
      .sort(
        (a, b) =>
          new Date(a.proximaRenovacion).getTime() - new Date(b.proximaRenovacion).getTime()
      );
  },
  /** Calcula la próxima renovación y la devuelve como string YYYY-MM-DD */
  calcularProximaFecha(fromDate: string, ciclo: 'MENSUAL' | 'ANUAL'): string {
    const from = fromDate
      ? new Date(fromDate + 'T00:00:00Z')
      : new Date();
    const next = nextRenewalDate(from, ciclo);
    return next.toISOString().split('T')[0];
  },
};
