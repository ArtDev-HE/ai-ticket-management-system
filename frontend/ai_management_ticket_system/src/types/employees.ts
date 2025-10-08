/**
 * ================================
 * 👤 EMPLEADOS TYPES
 * ================================
 * Mirrors backend data structure for empleados.js
 * Provides strong typing for employee management, analytics, and ticket assignments.
 */

/** Core Employee Object */
export interface Employee {
  id: string;
  nombre: string;
  correo?: string;
  cargo?: string;
  telefono?: string;
  activo: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  organizacion?: {
    departamento?: string;
    division?: string;
    rol?: string;
  };
}

/** Employee creation payload */
export interface CreateEmployeeRequest {
  id: string;
  nombre: string;
  correo?: string;
  cargo?: string;
  telefono?: string;
  activo?: boolean;
  organizacion?: {
    departamento?: string;
    division?: string;
    rol?: string;
  };
}

/** Employee update payload */
export interface UpdateEmployeeRequest {
  nombre?: string;
  correo?: string;
  cargo?: string;
  telefono?: string;
  activo?: boolean;
  organizacion?: {
    departamento?: string;
    division?: string;
    rol?: string;
  };
}

/** API Response for one employee */
export interface EmployeeResponse {
  data: Employee;
  message?: string;
}

/** API Response for list of employees */
export interface EmployeeListResponse {
  data: Employee[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}

/** Ticket summary for employee (used when fetching related tickets) */
export interface EmployeeTicket {
  id: string;
  titulo: string;
  estado: string;
  fecha_creacion: string;
  fecha_actualizado?: string;
  codigo_procedimiento?: string;
  tiempo_estimado?: number;
  tiempo_real?: number;
}

/** Response for employee tickets */
export interface EmployeeTicketsResponse {
  employee: Employee;
  tickets: EmployeeTicket[];
  total_tickets: number;
  completados: number;
  activos: number;
  cancelados: number;
}
