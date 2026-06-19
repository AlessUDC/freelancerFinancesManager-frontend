import { Ingreso, Gasto, Suscripcion } from '@/types';

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
  total(): number {
    return ingresosService.getAll().reduce((s, i) => s + i.monto, 0);
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
  total(): number {
    return gastosService.getAll().reduce((s, g) => s + g.monto, 0);
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
  total(): number {
    return suscripcionesService.getAll().reduce((s, i) => s + i.costo, 0);
  },
};
