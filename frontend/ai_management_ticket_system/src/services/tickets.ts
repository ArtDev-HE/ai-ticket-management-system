import api from "./api";
import {
  Ticket,
  TicketListResponse,
  TicketResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
} from "@/types/tickets";

/**
 * ================================
 * 🎫 TICKETS SERVICE (Frontend Mirror)
 * ================================
 * Strongly typed with interfaces from /types/tickets.ts
 */

/** ✅ Get all tickets with optional filters and pagination */
export const getTickets = async (
  filters: Record<string, any> = {}
): Promise<TicketListResponse> => {
  const res = await api.get<TicketListResponse>("/api/tickets", { params: filters });
  return res.data as TicketListResponse;
};

/** 🎯 Get single ticket by ID */
export const getTicketById = async (id: string): Promise<Ticket> => {
  const res = await api.get<Ticket>(`/api/tickets/${id}`);
  return res.data as Ticket;
};

/** 🧱 Create a new ticket */
export const createTicket = async (
  data: CreateTicketRequest
): Promise<TicketResponse> => {
  const res = await api.post<TicketResponse>("/api/tickets", data);
  return res.data as TicketResponse;
};

/** 🔄 Update an existing ticket */
export const updateTicket = async (
  id: string,
  data: UpdateTicketRequest
): Promise<TicketResponse> => {
  // The backend exposes specific update endpoints (accept, hito, estado, pause, resume, review, kpis).
  // Allow updating estado via this helper; for other updates use the dedicated service functions.
  if (data && (data as any).estado) {
    const res = await api.patch<TicketResponse>(`/api/tickets/${id}/estado`, { estado: (data as any).estado });
    return res.data as TicketResponse;
  }

  throw new Error('updateTicket: unsupported generic update. Use specific endpoints (acceptTicket, updateHito, updateEstado, pauseTicket, resumeTicket, reviewTicket, submitKpis).');
};

/** 🚫 Soft delete or cancel a ticket */
export const deleteTicket = async (id: string): Promise<TicketResponse> => {
  // Backend does not expose a DELETE; use estado = 'CANCELADO' to soft-delete
  const res = await api.patch<TicketResponse>(`/api/tickets/${id}/estado`, { estado: 'CANCELADO' });
  return res.data as TicketResponse;
};

/** 🧩 Get all tickets assigned to a specific employee */
export const getTicketsByEmployee = async (
  employeeId: string,
  filters: Record<string, any> = {}
): Promise<TicketListResponse> => {
  const res = await api.get<TicketListResponse>(`/api/empleados/${employeeId}/tickets`, {
    params: filters,
  });
  return res.data as TicketListResponse;
};

/** ⚡ Get all active or pending tickets for a specific department or project */
export const getTicketsByFilter = async (
  filterParams: Record<string, any>
): Promise<TicketListResponse> => {
  // Backend supports filtering via GET /api/tickets with query params
  return getTickets(filterParams);
};

/** 📊 Get aggregated ticket statistics (optional: for dashboards) */
export const getTicketStats = async (): Promise<any> => {
  // Backend doesn't expose a /stats endpoint; compute basic stats client-side from tickets
  // NOTE: for large datasets, replace this with an analytics backend call
  const res = await api.get<TicketListResponse>('/api/tickets', { params: { limit: 1000 } });
  // res.data may be { data: Ticket[] } or Ticket[] depending on backend contract; normalize
  const raw = res.data as unknown;
  const ticketsArr = Array.isArray(raw as any) ? (raw as any[]) : ((raw as any)?.data ?? []);
  const stats = {
    total: ticketsArr.length,
    completed: ticketsArr.filter((t: any) => t.estado === 'COMPLETADO').length,
    active: ticketsArr.filter((t: any) => t.estado === 'ACTIVO').length,
    paused: ticketsArr.filter((t: any) => t.estado === 'EN_PAUSA').length,
  };
  return stats;
};

/** ⏸️ Pause or resume a ticket */
export const updateTicketState = async (
  id: string,
  newState: string,
  data: Record<string, any> = {}
): Promise<TicketResponse> => {
  // backend endpoint is /api/tickets/:id/estado
  const res = await api.patch<TicketResponse>(`/api/tickets/${id}/estado`, { estado: newState });
  return res.data as TicketResponse;
};
// ===== Specific actions =====
export const acceptTicket = async (id: string, empleado_id: string) => {
  const res = await api.patch<TicketResponse>(`/api/tickets/${id}/accept`, { empleado_id });
  return res.data as TicketResponse;
};

export const updateHito = async (id: string, porcentaje: number, completado: boolean) => {
  const res = await api.patch<TicketResponse>(`/api/tickets/${id}/hito`, { porcentaje, completado });
  return res.data as TicketResponse;
};

export const reviewTicket = async (id: string, data: any) => {
  const res = await api.post(`/api/tickets/${id}/review`, data);
  return res.data;
};

export const submitKpis = async (id: string, kpis_especificos: any) => {
  const res = await api.post(`/api/tickets/${id}/kpis`, { kpis_especificos });
  return res.data;
};

export const pauseTicket = async (id: string, data: any) => {
  const res = await api.patch(`/api/tickets/${id}/pause`, data);
  return res.data;
};

export const resumeTicket = async (id: string, data: any) => {
  const res = await api.patch(`/api/tickets/${id}/resume`, data);
  return res.data;
};

export const requestReassignment = async (id: string, empleado_id: string, razon: string) => {
  const res = await api.patch(`/api/tickets/${id}/request-reassignment`, { empleado_id, razon });
  return res.data;
};
