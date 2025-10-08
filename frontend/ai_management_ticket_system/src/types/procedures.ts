/**
 * ================================
 * ⚙️ PROCEDURES TYPES
 * ================================
 * Mirrors the structure of backend `/api/procedimientos`
 * Used for CRUD operations, filters, and analytics.
 */

export interface Procedure {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  tiempo_estimado_horas?: number;
  complejidad?: "BAJA" | "MEDIA" | "ALTA";
  categoria?: string;
  departamento_id?: string;
  activo: boolean;
  recursos?: Record<string, any>;
  kpis?: Record<string, any>;
  responsabilidades?: Record<string, any>;
  validaciones?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/** 🧩 Used for creating a new procedure */
export interface CreateProcedureRequest {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  version?: string;
  tiempo_estimado_horas?: number;
  complejidad?: "BAJA" | "MEDIA" | "ALTA";
  categoria?: string;
  departamento_id?: string;
  activo?: boolean;
  recursos?: Record<string, any>;
  kpis?: Record<string, any>;
  responsabilidades?: Record<string, any>;
  validaciones?: Record<string, any>;
}

/** 🔄 Used for updating an existing procedure */
export interface UpdateProcedureRequest {
  nombre?: string;
  descripcion?: string;
  version?: string;
  tiempo_estimado_horas?: number;
  complejidad?: "BAJA" | "MEDIA" | "ALTA";
  categoria?: string;
  activo?: boolean;
  recursos?: Record<string, any>;
  kpis?: Record<string, any>;
  responsabilidades?: Record<string, any>;
  validaciones?: Record<string, any>;
}

/** 🔍 Filters for listing procedures */
export interface ProcedureFilters {
  activo?: boolean;
  departamento_id?: string;
  complejidad?: "BAJA" | "MEDIA" | "ALTA";
  limit?: number;
  offset?: number;
}

/** 📦 Standard paginated list response */
export interface ProcedureListResponse {
  data: Procedure[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/** 🎯 Single procedure response */
export interface ProcedureResponse {
  data: Procedure;
}
