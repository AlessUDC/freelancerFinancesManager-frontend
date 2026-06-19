export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export interface Ingreso {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
}

export interface Gasto {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
}

export interface Suscripcion {
  id: number;
  servicio: string;
  costo: number;
  renovacion: string;
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
}
