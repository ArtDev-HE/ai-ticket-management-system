import api from "./api";
import type {
  EmployeeAnalytics,
  ProcedureAnalytics,
  DepartmentAnalytics,
  WorkLineAnalytics,
} from "../types/analytics";

/**
 * ===============================
 * 📊 ANALYTICS SERVICE (Frontend)
 * ===============================
 * Mirrors analytics.js backend endpoints for dashboards, reports, and AI-driven insights.
 */

/** 👤 Get analytics for a single employee */
export const getEmployeeAnalytics = async (
  id: string,
  filters: Record<string, any> = {}
): Promise<EmployeeAnalytics> => {
  const res = await api.get(`/api/analytics/employee/${id}`, { params: filters });
  return res.data as EmployeeAnalytics;
};

/** ⚙️ Get analytics for a specific procedure */
export const getProcedureAnalytics = async (
  codigo: string,
  filters: Record<string, any> = {}
): Promise<ProcedureAnalytics> => {
  const res = await api.get(`/api/analytics/procedure/${codigo}`, { params: filters });
  return res.data as ProcedureAnalytics;
};

/** 🏢 Get analytics for a department */
export const getDepartmentAnalytics = async (
  id: string,
  filters: Record<string, any> = {}
): Promise<DepartmentAnalytics> => {
  const res = await api.get(`/api/analytics/department/${id}`, { params: filters });
  return res.data as DepartmentAnalytics;
};

/** 🧱 Get analytics for a work line (línea de trabajo) */
export const getWorkLineAnalytics = async (
  id: string,
  filters: Record<string, any> = {}
): Promise<WorkLineAnalytics> => {
  const res = await api.get(`/api/analytics/linea/${id}`, { params: filters });
  return res.data as WorkLineAnalytics;
};
