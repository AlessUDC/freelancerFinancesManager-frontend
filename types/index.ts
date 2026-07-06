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
  perfilFiscal?: PerfilFiscal;  // Datos de facturación freelancer
  appConfig?: any;              // Configuración de la app (taxCow, etc.)
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
  perfilFiscal?: PerfilFiscal;
  appConfig?: any;
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
  | 'SERVICIOS_PUBLICOS_CONECTIVIDAD'
  | 'COWORKING'
  | 'EDUCACION_CAPACITACION'
  | 'IMPUESTOS_LEGAL'
  | 'PERSONAL'

export interface Gasto {
  id: number;
  concepto: string;
  monto: number;
  moneda: string;
  categoria: GastoCategoria;
  esDeducible: boolean;
  fecha: string;
  esRecurrente?: boolean;
  cantidad?: number;
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
