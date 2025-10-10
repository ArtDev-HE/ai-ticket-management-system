/**
 * ========================================
 * 📊 ANALYTICS TYPES
 * ========================================
 * Defines TypeScript interfaces for analytics.js responses.
 * These types are used by components, hooks, and service calls.
 */

/* ──────────────────────────────── */
/* 🔹 Shared / Generic Interfaces  */
/* ──────────────────────────────── */

export interface DateRange {
  from: string | "all";
  to: string | "all";
}

export interface TicketEstado {
  estado: string;
  count: number;
}

/* ──────────────────────────────── */
/* 👤 Employee Analytics           */
/* ──────────────────────────────── */

export interface EmployeeInfo {
  id: string;
  nombre: string;
  organizacion?: Record<string, unknown>;
}

export interface EmployeePerformance {
  total_tickets: number;
  completados: number;
  cancelados: number;
  activos: number;
  eficiencia_promedio: number | null;
  horas_trabajadas: number;
  total_pausas_horas: number;
  tiempo_aceptacion_promedio_horas: number | null;
  tickets_con_kpis: number;
  kpi_compliance_avg: number | null;
  tickets_devueltos: number;
}

export interface EfficiencyTrend {
  id: string;
  titulo: string;
  fecha_creacion: string;
  fecha_actualizado: string;
  eficiencia_temporal: number | null;
  tiempo_estimado: number | null;
  tiempo_real: number | null;
}

export interface EmployeeAnalytics {
  employee: EmployeeInfo;
  date_range: DateRange;
  performance: EmployeePerformance;
  tickets_by_estado: TicketEstado[];
  efficiency_trend: EfficiencyTrend[];
}

/* ──────────────────────────────── */
/* ⚙️ Procedure Analytics          */
/* ──────────────────────────────── */

export interface ProcedureInfo {
  codigo: string;
  nombre: string;
  tiempo_estimado_horas: number;
  complejidad: "BAJA" | "MEDIA" | "ALTA";
}

export interface ProcedurePerformance {
  total_tickets: number;
  completados: number;
  completion_rate: string;
  eficiencia_promedio: number | null;
  tiempo_real_promedio_horas: number | null;
  tiempo_pausa_promedio_horas: number | null;
  tickets_con_kpis: number;
  kpi_compliance_avg: number | null;
}

export interface TopPerformer {
  empleado_id: string;
  empleado_nombre: string;
  tickets_completados: number;
  eficiencia_promedio: number | null;
}

export interface TimeDistribution {
  categoria: string;
  count: number;
}

export interface ProcedureAnalytics {
  procedure: ProcedureInfo;
  date_range: DateRange;
  performance: ProcedurePerformance;
  top_performers: TopPerformer[];
  time_distribution: TimeDistribution[];
}

/* ──────────────────────────────── */
/* 🏢 Department Analytics         */
/* ──────────────────────────────── */

export interface DepartmentInfo {
  id: string;
  nombre: string;
}

export interface DepartmentPerformance {
  total_tickets: number;
  completados: number;
  activos: number;
  completion_rate: string;
  eficiencia_promedio: number | null;
  total_horas_trabajadas: number;
  empleados_activos: number;
}

export interface EmployeePerformanceSummary {
  empleado_id: string;
  empleado_nombre: string;
  total_tickets: number;
  completados: number;
  eficiencia_promedio: number | null;
}

export interface WorkloadDistribution {
  empleado_nombre: string;
  tickets_activos: number;
  tickets_pendientes: number;
}

export interface DepartmentAnalytics {
  department: DepartmentInfo;
  date_range: DateRange;
  performance: DepartmentPerformance;
  employee_performance: EmployeePerformanceSummary[];
  workload_distribution: WorkloadDistribution[];
}

/* ──────────────────────────────── */
/* 🧱 Work Line Analytics          */
/* ──────────────────────────────── */

export interface WorkLineInfo {
  id: string;
  nombre: string;
  tipo?: string;
  orden?: number;
}

export interface WorkLineProgress {
  total_tickets: number;
  completados: number;
  activos: number;
  pausados: number;
  pendientes: number;
  porcentaje_completado: string;
}

export interface TimeMetrics {
  total_estimado_horas: number;
  total_real_horas: number;
  diferencia_horas: number;
  eficiencia: string;
}

export interface Bottleneck {
  ticket_id: string;
  titulo: string;
  asignado_a: string;
  tiempo_estimado: number;
  tiempo_actual: number;
  retraso_horas: number;
}

export interface BlockedTicket {
  id: string;
  titulo: string;
  dependencias: string[];
}

export interface WorkLineTicket {
  id: string;
  titulo: string;
  estado: string;
  asignado_a: string;
  hito_actual?: string;
  fecha_creacion: string;
  fecha_actualizado: string;
}

export interface WorkLineAnalytics {
  work_line: WorkLineInfo;
  progress: WorkLineProgress;
  time_metrics: TimeMetrics;
  tickets: WorkLineTicket[];
  bottlenecks: Bottleneck[];
  blocked_tickets: BlockedTicket[];
}
