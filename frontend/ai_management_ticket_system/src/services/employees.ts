import api from "./api";
import type {
  Employee,
  EmployeeResponse,
  EmployeeListResponse,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeTicketsResponse,
} from "@/types/employees";

/**
 * ================================
 * 👤 EMPLOYEES SERVICE
 * ================================
 * Mirrors backend routes from empleados.js
 * Handles CRUD, workload tracking, and related tickets.
 */

/** ✅ Get all employees (with optional filters and pagination) */
export const getEmployees = async (
  filters: Record<string, unknown> = {}
): Promise<EmployeeListResponse> => {
  const res = await api.get<EmployeeListResponse>("/api/empleados", { params: filters });
  return res.data as EmployeeListResponse;
};

/** 🎯 Get single employee by ID */
export const getEmployeeById = async (id: string): Promise<Employee> => {
  const res = await api.get<Employee>(`/api/empleados/${id}`);
  return res.data as Employee;
};

/** ⚙️ Get employee workload and performance summary */
export const getEmployeeWorkload = async (id: string): Promise<Record<string, unknown>> => {
  // You can define a `EmployeeWorkload` type later if needed
  const res = await api.get(`/api/empleados/${id}/workload`);
  return res.data as Record<string, unknown>;
};

/** 🎫 Get all tickets assigned to a specific employee */
export const getEmployeeTickets = async (
  id: string,
  filters: Record<string, unknown> = {}
): Promise<EmployeeTicketsResponse> => {
  const res = await api.get<EmployeeTicketsResponse>(`/api/empleados/${id}/tickets`, { params: filters });
  return res.data as EmployeeTicketsResponse;
};

/** 🧱 Create a new employee */
export const createEmployee = async (
  data: CreateEmployeeRequest
): Promise<Employee> => {
  const res = await api.post<Employee>("/api/empleados", data);
  return res.data as Employee;
};

/** 🔄 Update existing employee */
export const updateEmployee = async (
  id: string,
  data: UpdateEmployeeRequest
): Promise<Employee> => {
  const res = await api.patch<Employee>(`/api/empleados/${id}`, data);
  return res.data as Employee;
};

/** 🚫 Soft delete (deactivate) employee */
export const deleteEmployee = async (id: string): Promise<EmployeeResponse> => {
  const res = await api.delete<EmployeeResponse>(`/api/empleados/${id}`);
  return res.data as EmployeeResponse;
};
