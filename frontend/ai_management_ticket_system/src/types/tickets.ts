/**
 * ========================================
 * 🎫 TICKETS TYPES
 * ========================================
 * Defines interfaces for the tickets domain.
 * Used by API service calls and UI components.
 */

/* ──────────────────────────────── */
/* 🔹 ENUM-LIKE CONSTANTS          */
/* ──────────────────────────────── */

export type TicketEstado = 
  | "CREADO"
  | "ACTIVO"
  | "EN_PAUSA"
  | "COMPLETADO"
  | "CANCELADO";

export type TicketPrioridad = 
  | "BAJA"
  | "MEDIA"
  | "ALTA"
  | "CRITICA";

/* ──────────────────────────────── */
/* 🔹 BASE STRUCTURES              */
/* ──────────────────────────────── */

export interface Ticket {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: TicketEstado;
  prioridad?: TicketPrioridad;
  codigo_procedimiento?: string;
  codigo_actividad?: string;
  codigo_linea_trabajo?: string;
  asignado_a?: string;
  creador_id?: string;
  departamento_id?: string;
  fecha_creacion: string;
  fecha_actualizado?: string;
  fecha_aceptacion?: string;
  fecha_cierre?: string;
  tiempo_estimado?: number;
  tiempo_real?: number;
  tiempo_pausa_total?: number;
  eficiencia_temporal?: number;
  kpis?: Record<string, any>;
  recursos?: Record<string, any>;
  revision?: Record<string, any>;
  flujo?: {
    dependencias?: string[];
    pasos?: string[];
    actual?: string;
  };
}

/* ──────────────────────────────── */
/* 🔹 REQUEST TYPES                */
/* ──────────────────────────────── */

export interface CreateTicketRequest {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad?: TicketPrioridad;
  codigo_procedimiento: string;
  asignado_a?: string;
  tiempo_estimado?: number;
  departamento_id?: string;
  creador_id?: string;
  kpis?: Record<string, any>;
  recursos?: Record<string, any>;
  flujo?: Record<string, any>;
}

export interface UpdateTicketRequest {
  titulo?: string;
  descripcion?: string;
  estado?: TicketEstado;
  prioridad?: TicketPrioridad;
  asignado_a?: string;
  tiempo_estimado?: number;
  tiempo_real?: number;
  tiempo_pausa_total?: number;
  eficiencia_temporal?: number;
  kpis?: Record<string, any>;
  recursos?: Record<string, any>;
  revision?: Record<string, any>;
  flujo?: Record<string, any>;
}

/* ──────────────────────────────── */
/* 🔹 RESPONSE TYPES               */
/* ──────────────────────────────── */

export interface TicketResponse {
  success?: boolean;
  message?: string;
  ticket: Ticket;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

/* ──────────────────────────────── */
/* 🔹 ANALYTICS SUPPORT            */
/* ──────────────────────────────── */

export interface TicketStatusCount {
  estado: TicketEstado;
  count: number;
}

export interface TicketEfficiencySummary {
  promedio_eficiencia: number;
  total_tickets: number;
  completados: number;
  activos: number;
  cancelados: number;
  horas_totales: number;
}

/* ──────────────────────────────── */
/* 🔹 VALIDATION STRUCTURES        */
/* ──────────────────────────────── */

export interface TicketValidation {
  campo: string;
  valido: boolean;
  mensaje?: string;
}

/* ──────────────────────────────── */
/* 🔹 UTILITY TYPES                */
/* ──────────────────────────────── */

export type TicketPatchPayload = Partial<UpdateTicketRequest>;
