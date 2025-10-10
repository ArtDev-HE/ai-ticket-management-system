import axios from "axios";
import { API_BASE } from '../config';
import auth from './auth';
import type { CreateTicketRequest, TicketListResponse, TicketResponse } from '../types/tickets';

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach auth token if present (future-proof)
api.interceptors.request.use(
  (config) => {
    try {
      const token = auth.getToken();
      if (token && config && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_e) {
      // ignore (server-side or access issues)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap data and provide standard error shape
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error without using `any`
    const err = error as unknown;
    if (typeof err === 'object' && err !== null) {
      const e = err as { response?: { data?: unknown }; message?: string };
      if (e.response && e.response.data) {
        return Promise.reject(e.response.data);
      }
      return Promise.reject({ message: e.message ?? 'Network Error' });
    }
    return Promise.reject({ message: 'Network Error' });
  }
);

// ========== Basic Operations ==========
export const getAllTickets = async (filters: Record<string, unknown> = {}) => {
  const res = await api.get<TicketListResponse>("/api/tickets", { params: filters });
  return res.data;
};

export const getTicketById = async (id: string) => {
  const res = await api.get<TicketResponse>(`/api/tickets/${id}`);
  return res.data;
};

export const createTicket = async (data: CreateTicketRequest) => {
  const res = await api.post<TicketResponse>(`/api/tickets`, data);
  return res.data;
};

// ========== Ticket Actions ==========
export const acceptTicket = async (id: string, empleado_id: string) => {
  const res = await api.patch(`/api/tickets/${id}/accept`, { empleado_id });
  return res.data;
};

export const updateHito = async (id: string, porcentaje: number, completado: boolean) => {
  const res = await api.patch(`/api/tickets/${id}/hito`, { porcentaje, completado });
  return res.data;
};

export const updateEstado = async (id: string, estado: string) => {
  const res = await api.patch(`/api/tickets/${id}/estado`, { estado });
  return res.data;
};

// ========== Requests & Reviews ==========
export const requestReassignment = async (id: string, empleado_id: string, razon: string) => {
  const res = await api.patch(`/api/tickets/${id}/request-reassignment`, { empleado_id, razon });
  return res.data;
};

export const reviewTicket = async (id: string, data: Record<string, unknown>) => {
  const res = await api.post(`/api/tickets/${id}/review`, data);
  return res.data;
};

// ========== KPIs ==========
export const submitKpis = async (id: string, kpis_especificos: Record<string, unknown>) => {
  const res = await api.post(`/api/tickets/${id}/kpis`, { kpis_especificos });
  return res.data;
};

// ========== Pause / Resume ==========
export const pauseTicket = async (id: string, data: Record<string, unknown>) => {
  const res = await api.patch(`/api/tickets/${id}/pause`, data);
  return res.data;
};

export const resumeTicket = async (id: string, data: Record<string, unknown>) => {
  const res = await api.patch(`/api/tickets/${id}/resume`, data);
  return res.data;
};

export default api;
