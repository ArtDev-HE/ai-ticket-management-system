import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // adjust to your backend port
  headers: { "Content-Type": "application/json" },
});

// ========== Basic Operations ==========
export const getAllTickets = async (filters = {}) => {
  const res = await api.get("/", { params: filters });
  return res.data;
};

export const getTicketById = async (id: string) => {
  const res = await api.get(`/${id}`);
  return res.data;
};

export const createTicket = async (data: any) => {
  const res = await api.post("/", data);
  return res.data;
};

// ========== Ticket Actions ==========
export const acceptTicket = async (id: string, empleado_id: string) => {
  const res = await api.patch(`/${id}/accept`, { empleado_id });
  return res.data;
};

export const updateHito = async (id: string, porcentaje: number, completado: boolean) => {
  const res = await api.patch(`/${id}/hito`, { porcentaje, completado });
  return res.data;
};

export const updateEstado = async (id: string, estado: string) => {
  const res = await api.patch(`/${id}/estado`, { estado });
  return res.data;
};

// ========== Requests & Reviews ==========
export const requestReassignment = async (id: string, empleado_id: string, razon: string) => {
  const res = await api.patch(`/${id}/request-reassignment`, { empleado_id, razon });
  return res.data;
};

export const reviewTicket = async (id: string, data: any) => {
  const res = await api.post(`/${id}/review`, data);
  return res.data;
};

// ========== KPIs ==========
export const submitKpis = async (id: string, kpis_especificos: any) => {
  const res = await api.post(`/${id}/kpis`, { kpis_especificos });
  return res.data;
};

// ========== Pause / Resume ==========
export const pauseTicket = async (id: string, data: any) => {
  const res = await api.patch(`/${id}/pause`, data);
  return res.data;
};

export const resumeTicket = async (id: string, data: any) => {
  const res = await api.patch(`/${id}/resume`, data);
  return res.data;
};

export default api;
