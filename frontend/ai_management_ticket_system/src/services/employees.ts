import api from "./api";
import type {
  Employee,
  EmployeeResponse,
  EmployeeListResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeTicketsResponse,
} from "@/types/empleados";

/**
 * ================================
 * 👤 EMPLOYEES SERVICE
 * ================================
 * Mirrors backend routes from empleados.js
 * Handles CRUD, workload tracking, and related tickets.
 */

/** ✅ Get all employees (with optional filters and pagination) */
export const getEmployees = async (
  filters: Record<string, any> = {}
): Promise<EmployeeListResponse> => {
  const res = await api.get("/api/empleados", { params: filters });
  return res.data;
};

/** 🎯 Get single employee by ID */
export const getEmployeeById = async (id: string): Promise<Employee> => {
  const res = await api.get(`/api/empleados/${id}`);
  return res.data;
};

/** ⚙️ Get employee workload and performance summary */
export const getEmployeeWorkload = async (id: string): Promise<any> => {
  // You can define a `EmployeeWorkload` type later if needed
  const res = await api.get(`/api/empleados/${id}/workload`);
  return res.data;
};

/** 🎫 Get all tickets assigned to a specific employee */
export const getEmployeeTickets = async (
  id: string,
  filters: Record<string, any> = {}
): Promise<EmployeeTicketsResponse> => {
  const res = await api.get(`/api/empleados/${id}/tickets`, { params: filters });
  return res.data;
};

/** 🧱 Create a new employee */
export const createEmployee = async (
  data: CreateEmployeeRequest
): Promise<Employee> => {
  const res = await api.post("/api/empleados", data);
  return res.data;
};

/** 🔄 Update existing employee */
export const updateEmployee = async (
  id: string,
  data: UpdateEmployeeRequest
): Promise<Employee> => {
  const res = await api.patch(`/api/empleados/${id}`, data);
  return res.data;
};

/** 🚫 Soft delete (deactivate) employee */
export const deleteEmployee = async (id: string): Promise<EmployeeResponse> => {
  const res = await api.delete(`/api/empleados/${id}`);
  return res.data;
};
