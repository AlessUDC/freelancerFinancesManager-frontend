import api from '@/lib/axios';
import { Ingreso, Gasto, Suscripcion } from '@/types';
import { nextRenewalDate } from '@/lib/dates';

// Helper: obtiene el userId del usuario guardado en localStorage
function getUsuarioId(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    return u?.id ?? 0;
  } catch {
    return 0;
  }
}

// Helper: normaliza un Ingreso del backend (BigDecimal viene como number en JSON)
function mapIngreso(raw: Record<string, unknown>): Ingreso {
  return {
    id: raw.id as number,
    proyectoNombre: raw.proyectoNombre as string,
    montoBruto: Number(raw.montoBruto),
    retencion: Number(raw.retencion ?? 0),
    montoNeto: Number(raw.montoNeto),
    moneda: raw.moneda as string,
    status: raw.status as Ingreso['status'],
    fecha: (raw.fecha as string) ?? '',
    fechaEmision: (raw.fechaEmision as string) ?? undefined,
    fechaVencimiento: (raw.fechaVencimiento as string) ?? undefined,
  };
}

// ── Ingresos ──────────────────────────────────────────────────
export const ingresosService = {
  async getAll(): Promise<Ingreso[]> {
    const usuarioId = getUsuarioId();
    if (!usuarioId) return [];
    const { data } = await api.get<Record<string, unknown>[]>(`/ingresos?usuarioId=${usuarioId}`);
    return data.map(mapIngreso);
  },

  async add(item: Omit<Ingreso, 'id'>): Promise<Ingreso> {
    const { data } = await api.post<Record<string, unknown>>('/ingresos', {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapIngreso(data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/ingresos/${id}`);
  },

  async updateStatus(id: number, status: Ingreso['status']): Promise<Ingreso> {
    const { data } = await api.patch<Record<string, unknown>>(`/ingresos/${id}/status`, status, {
      headers: { 'Content-Type': 'text/plain' },
    });
    return mapIngreso(data);
  },

  async update(id: number, item: Partial<Omit<Ingreso, 'id'>>): Promise<Ingreso> {
    const { data } = await api.put<Record<string, unknown>>(`/ingresos/${id}`, {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapIngreso(data);
  },

  /** Solo suma ingresos PAGADOS (monto neto real) — calcula sobre lista ya cargada */
  totalPagado(list: Ingreso[]): number {
    return list
      .filter((i) => i.status === 'PAGADO')
      .reduce((s, i) => s + i.montoNeto, 0);
  },

  /** Suma todos los ingresos netos — calcula sobre lista ya cargada */
  totalNeto(list: Ingreso[]): number {
    return list.reduce((s, i) => s + i.montoNeto, 0);
  },
};

// Helper: normaliza un Gasto del backend
function mapGasto(raw: Record<string, unknown>): Gasto {
  return {
    id: raw.id as number,
    concepto: raw.concepto as string,
    monto: Number(raw.monto),
    moneda: raw.moneda as string,
    categoria: raw.categoria as Gasto['categoria'],
    esDeducible: raw.esDeducible as boolean,
    fecha: (raw.fecha as string) ?? '',
    esRecurrente: raw.esRecurrente as boolean,
    cantidad: raw.cantidad as number,
  };
}

// ── Gastos ────────────────────────────────────────────────────
export const gastosService = {
  async getAll(): Promise<Gasto[]> {
    const usuarioId = getUsuarioId();
    if (!usuarioId) return [];
    const { data } = await api.get<Record<string, unknown>[]>(`/gastos?usuarioId=${usuarioId}`);
    return data.map(mapGasto);
  },

  async add(item: Omit<Gasto, 'id'>): Promise<Gasto> {
    const { data } = await api.post<Record<string, unknown>>('/gastos', {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapGasto(data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/gastos/${id}`);
  },

  async update(id: number, item: Partial<Omit<Gasto, 'id'>>): Promise<Gasto> {
    const { data } = await api.put<Record<string, unknown>>(`/gastos/${id}`, {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapGasto(data);
  },

  total(list: Gasto[]): number {
    return list.reduce((s, g) => s + g.monto, 0);
  },

  totalDeducible(list: Gasto[]): number {
    return list
      .filter((g) => g.esDeducible)
      .reduce((s, g) => s + g.monto, 0);
  },

  /** Gasto mensual fijo estimado (para calcular Runway) */
  gastoFijoMensual(list: Gasto[]): number {
    return list
      .filter((g) => g.esRecurrente)
      .reduce((s, g) => s + g.monto, 0);
  },
};

// Helper: normaliza una Suscripcion del backend
function mapSuscripcion(raw: Record<string, unknown>): Suscripcion {
  return {
    id: raw.id as number,
    servicio: raw.servicio as string,
    monto: Number(raw.monto),
    moneda: raw.moneda as string,
    ciclo: raw.ciclo as Suscripcion['ciclo'],
    proximaRenovacion: (raw.proximaRenovacion as string) ?? '',
    status: raw.status as Suscripcion['status'],
  };
}

// ── Suscripciones ─────────────────────────────────────────────
export const suscripcionesService = {
  async getAll(): Promise<Suscripcion[]> {
    const usuarioId = getUsuarioId();
    if (!usuarioId) return [];
    const { data } = await api.get<Record<string, unknown>[]>(`/suscripciones?usuarioId=${usuarioId}`);
    return data.map(mapSuscripcion);
  },

  async add(item: Omit<Suscripcion, 'id'>): Promise<Suscripcion> {
    const { data } = await api.post<Record<string, unknown>>('/suscripciones', {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapSuscripcion(data);
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/suscripciones/${id}`);
  },

  async update(id: number, item: Partial<Omit<Suscripcion, 'id'>>): Promise<Suscripcion> {
    const { data } = await api.put<Record<string, unknown>>(`/suscripciones/${id}`, {
      ...item,
      usuarioId: getUsuarioId(),
    });
    return mapSuscripcion(data);
  },

  async toggleStatus(id: number, currentStatus: Suscripcion['status']): Promise<Suscripcion> {
    const newStatus = currentStatus === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';
    const { data } = await api.put<Record<string, unknown>>(`/suscripciones/${id}`, {
      status: newStatus,
      usuarioId: getUsuarioId(),
    });
    return mapSuscripcion(data);
  },

  /** Costo mensual de todas las suscripciones activas (anuales divididas en 12) */
  costoMensualActivo(list: Suscripcion[]): number {
    return list
      .filter((s) => s.status === 'ACTIVA')
      .reduce((sum, s) => sum + (s.ciclo === 'ANUAL' ? s.monto / 12 : s.monto), 0);
  },

  total(list: Suscripcion[]): number {
    return list
      .filter((s) => s.status === 'ACTIVA')
      .reduce((s, i) => s + i.monto, 0);
  },

  /** Suscripciones que renuevan en los próximos `days` días */
  proximasRenovaciones(list: Suscripcion[], days = 7): Suscripcion[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + days);

    return list
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
