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
  const res = await api.get("/api/tickets", { params: filters });
  return res.data;
};

/** 🎯 Get single ticket by ID */
export const getTicketById = async (id: string): Promise<Ticket> => {
  const res = await api.get(`/api/tickets/${id}`);
  return res.data;
};

/** 🧱 Create a new ticket */
export const createTicket = async (
  data: CreateTicketRequest
): Promise<TicketResponse> => {
  const res = await api.post("/api/tickets", data);
  return res.data;
};

/** 🔄 Update an existing ticket */
export const updateTicket = async (
  id: string,
  data: UpdateTicketRequest
): Promise<TicketResponse> => {
  const res = await api.patch(`/api/tickets/${id}`, data);
  return res.data;
};

/** 🚫 Soft delete or cancel a ticket */
export const deleteTicket = async (id: string): Promise<TicketResponse> => {
  const res = await api.delete(`/api/tickets/${id}`);
  return res.data;
};

/** 🧩 Get all tickets assigned to a specific employee */
export const getTicketsByEmployee = async (
  employeeId: string,
  filters: Record<string, any> = {}
): Promise<TicketListResponse> => {
  const res = await api.get(`/api/empleados/${employeeId}/tickets`, {
    params: filters,
  });
  return res.data;
};

/** ⚡ Get all active or pending tickets for a specific department or project */
export const getTicketsByFilter = async (
  filterParams: Record<string, any>
): Promise<TicketListResponse> => {
  const res = await api.get("/api/tickets/filter", { params: filterParams });
  return res.data;
};

/** 📊 Get aggregated ticket statistics (optional: for dashboards) */
export const getTicketStats = async (): Promise<any> => {
  const res = await api.get("/api/tickets/stats");
  return res.data;
};

/** ⏸️ Pause or resume a ticket */
export const updateTicketState = async (
  id: string,
  newState: string,
  data: Record<string, any> = {}
): Promise<TicketResponse> => {
  const res = await api.patch(`/api/tickets/${id}/state`, {
    estado: newState,
    ...data,
  });
  return res.data;
};
