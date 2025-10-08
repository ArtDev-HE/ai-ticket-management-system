import api from "./api";
import {
  Procedure,
  CreateProcedureRequest,
  UpdateProcedureRequest,
  ProcedureFilters,
  ProcedureListResponse,
  ProcedureResponse,
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
  const res = await api.get<ProcedureResponse>(`/api/procedimientos/${codigo}`);
  return res.data.data;
};

/** 🧱 Create a new procedure */
export const createProcedure = async (
  data: CreateProcedureRequest
): Promise<Procedure> => {
  const res = await api.post<ProcedureResponse>("/api/procedimientos", data);
  return res.data.data;
};

/** 🔄 Update an existing procedure */
export const updateProcedure = async (
  codigo: string,
  data: UpdateProcedureRequest
): Promise<Procedure> => {
  const res = await api.patch<ProcedureResponse>(
    `/api/procedimientos/${codigo}`,
    data
  );
  return res.data.data;
};

/** 🚫 Soft delete (deactivate) a procedure */
export const deleteProcedure = async (codigo: string): Promise<Procedure> => {
  const res = await api.delete<ProcedureResponse>(
    `/api/procedimientos/${codigo}`
  );
  return res.data.data;
};
