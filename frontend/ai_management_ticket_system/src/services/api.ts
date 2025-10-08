import axios from "axios";
import { API_BASE } from '../config';

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach auth token if present (future-proof)
api.interceptors.request.use(
  (config) => {
    try {
      // In Next.js/browser env, token could be stored in localStorage
      const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
      if (token && config && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
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
    // Normalize error
    const err = error;
    if (err.response && err.response.data) {
      return Promise.reject(err.response.data);
    }
    return Promise.reject({ message: err.message || 'Network Error' });
  }
);

// ========== Basic Operations ==========
export const getAllTickets = async (filters = {}) => {
  const res = await api.get("/api/tickets", { params: filters });
  return res.data;
};

export const getTicketById = async (id: string) => {
  const res = await api.get(`/api/tickets/${id}`);
  return res.data;
};

export const createTicket = async (data: any) => {
  const res = await api.post(`/api/tickets`, data);
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

export const reviewTicket = async (id: string, data: any) => {
  const res = await api.post(`/api/tickets/${id}/review`, data);
  return res.data;
};

// ========== KPIs ==========
export const submitKpis = async (id: string, kpis_especificos: any) => {
  const res = await api.post(`/api/tickets/${id}/kpis`, { kpis_especificos });
  return res.data;
};

// ========== Pause / Resume ==========
export const pauseTicket = async (id: string, data: any) => {
  const res = await api.patch(`/api/tickets/${id}/pause`, data);
  return res.data;
};

export const resumeTicket = async (id: string, data: any) => {
  const res = await api.patch(`/api/tickets/${id}/resume`, data);
  return res.data;
};

export default api;
