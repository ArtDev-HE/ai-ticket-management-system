import api from "./api";
import {
  Procedure,
  CreateProcedureRequest,
  UpdateProcedureRequest,
  ProcedureFilters,
  ProcedureListResponse,
} from "@/types/procedures";

/**
 * ================================
 * ⚙️ PROCEDURES SERVICE (Frontend Mirror)
 * ================================
 * Mirrors backend routes from procedimientos.js
 * Handles CRUD operations, filtering, and pagination.
 */

/** 🔍 Get all procedures with optional filters and pagination */
export const getProcedures = async (
  filters: ProcedureFilters = {}
): Promise<ProcedureListResponse> => {
  const res = await api.get<ProcedureListResponse>("/api/procedimientos", {
    params: filters,
  });
  return res.data;
};

/** 🎯 Get single procedure by code */
export const getProcedureByCode = async (
  codigo: string
): Promise<Procedure> => {
  const res = await api.get<Procedure>(`/api/procedimientos/${codigo}`);
  return res.data;
};

/** 🧱 Create a new procedure */
export const createProcedure = async (
  data: CreateProcedureRequest
): Promise<Procedure> => {
  const res = await api.post<Procedure>("/api/procedimientos", data);
  return res.data;
};

/** 🔄 Update an existing procedure */
export const updateProcedure = async (
  codigo: string,
  data: UpdateProcedureRequest
): Promise<Procedure> => {
  const res = await api.patch<Procedure>(`/api/procedimientos/${codigo}`, data);
  return res.data;
};

/** 🚫 Soft delete (deactivate) a procedure */
export const deleteProcedure = async (codigo: string): Promise<Procedure> => {
  const res = await api.delete<Procedure>(`/api/procedimientos/${codigo}`);
  return res.data;
};
