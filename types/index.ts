// ── Auth ─────────────────────────────────────────────────────
export interface PerfilFiscal {
  razonSocial: string;     // Nombre comercial / Razón social
  rucNif: string;          // Documento fiscal (RUC, NIF, RFC…)
  direccionFiscal: string; // Dirección para facturas
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  monedaBase?: string;          // 'USD', 'MXN', 'EUR', etc.
  zonaHoraria?: string;         // 'America/Mexico_City'
  porcentajeImpuesto?: number;  // % a reservar para impuestos (ej. 20)
  perfilFiscal?: PerfilFiscal;  // Datos de facturación freelancer
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  nombre: string;
  email: string;
  password?: string;
  monedaBase?: string;
  zonaHoraria?: string;
  porcentajeImpuesto?: number;
}

// ── Ingresos ─────────────────────────────────────────────────
export type IngresoStatus = 'ESTIMADO' | 'PENDIENTE' | 'PAGADO' | 'ATRASADO';

export interface Ingreso {
  id: number;
  proyectoNombre: string;   // Antes: "concepto"
  montoBruto: number;
  retencion: number;        // Porcentaje (0–100)
  montoNeto: number;        // Calculado: montoBruto * (1 - retencion/100)
  moneda: string;           // 'USD', 'EUR', 'MXN'
  status: IngresoStatus;
  fecha: string;            // ISO 8601 (fecha de pago)
  fechaEmision?: string;    // ISO 8601
  fechaVencimiento?: string;// ISO 8601
}

// ── Gastos ───────────────────────────────────────────────────
export type GastoCategoria =
  | 'TECNOLOGIA_SAAS'
  | 'EQUIPAMIENTO_HARDWARE'
  | 'INFRAESTRUCTURA_OFICINA'
  | 'MARKETING_SERVICIOS';

export interface Gasto {
  id: number;
  concepto: string;
  monto: number;
  moneda: string;
  categoria: GastoCategoria;
  esDeducible: boolean;
  fecha: string;
  esRecurrente?: boolean;
}

// ── Suscripciones ─────────────────────────────────────────────
export type SuscripcionCiclo = 'MENSUAL' | 'ANUAL';
export type SuscripcionStatus = 'ACTIVA' | 'PAUSADA';

export interface Suscripcion {
  id: number;
  servicio: string;
  monto: number;
  moneda: string;
  ciclo: SuscripcionCiclo;
  proximaRenovacion: string;  // ISO 8601
  status: SuscripcionStatus;
}
