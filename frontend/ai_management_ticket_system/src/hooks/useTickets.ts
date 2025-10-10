"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TicketListResponse, Ticket } from "@/types/tickets";
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketsByEmployee,
  getTicketsByFilter,
  getTicketStats,
  updateTicketState,
} from "@/services/tickets";
import {
  acceptTicket,
  updateHito,
  reviewTicket,
  submitKpis,
  pauseTicket,
  resumeTicket,
  requestReassignment,
} from "@/services/tickets";

/**
 * ==========================
 * 🎫 useTickets Hook
 * ==========================
 * Provides cached access to ticket data + mutations
 * Mirrors the backend tickets.js endpoints.
 */

export const useTickets = (filters: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient();

  // ─── GET all tickets ───────────────────────────────────────────────
  const {
    data: tickets,
    isLoading,
    isError,
    refetch,
  } = useQuery<TicketListResponse>({
    queryKey: ["tickets", filters],
    queryFn: () => getTickets(filters),
    // always enabled for list; filters control cached key
    enabled: true,
  });

  // ─── CREATE a new ticket ───────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  // ─── UPDATE an existing ticket ─────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      // Route to specific endpoints based on payload shape
      if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        if ('empleado_id' in d && d.empleado_id && d.action === 'accept') {
          return acceptTicket(id, String(d.empleado_id));
        }
        if ('porcentaje' in d && 'completado' in d) {
          const pct = Number(d.porcentaje as unknown);
          const comp = Boolean(d.completado as unknown);
          return updateHito(id, pct, comp);
        }
        if ('accion' in d && (d.accion === 'aprobar' || d.accion === 'rechazar' || d.accion === 'reasignar')) {
          return reviewTicket(id, d as unknown as Record<string, unknown>);
        }
        if ('kpis_especificos' in d) {
          return submitKpis(id, d.kpis_especificos as unknown as Record<string, unknown>);
        }
        if ('pause' in d) {
          return pauseTicket(id, d.pause as unknown as Record<string, unknown>);
        }
        if ('resume' in d) {
          return resumeTicket(id, d.resume as unknown as Record<string, unknown>);
        }
        if ('requestReassignment' in d) {
          const rr = d.requestReassignment as Record<string, unknown> | undefined;
          if (rr && 'empleado_id' in rr && 'razon' in rr) {
            return requestReassignment(id, String(rr.empleado_id), String(rr.razon));
          }
        }
      }

      // Fallback: allow setting estado via updateTicket helper
      return updateTicket(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  // ─── DELETE a ticket ───────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  // ─── UPDATE ticket state (pause/resume/etc) ────────────────────────
  const updateStateMutation = useMutation({
    mutationFn: ({
      id,
      newState,
      data,
    }: {
      id: string;
      newState: string;
      data?: Record<string, unknown>;
    }) => updateTicketState(id, newState, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  return {
    tickets,
    isLoading,
    isError,
    refetch,
    createTicket: createMutation.mutateAsync,
    updateTicket: updateMutation.mutateAsync,
    deleteTicket: deleteMutation.mutateAsync,
    updateTicketState: updateStateMutation.mutateAsync,
  };
};

/**
 * 🔍 useTicketById - Fetch a single ticket
 */
export const useTicketById = (id?: string) => {
  return useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: () => getTicketById(id as string),
    enabled: !!id,
  });
};

/**
 * 👷‍♂️ useTicketsByEmployee - Get tickets for specific employee
 */
export const useTicketsByEmployee = (employeeId?: string) => {
  return useQuery<TicketListResponse>({
    queryKey: ["tickets", "employee", employeeId],
    queryFn: () => getTicketsByEmployee(employeeId as string),
    enabled: !!employeeId,
  });
};

/**
 * 📊 useTicketStats - Dashboard overview
 */
export const useTicketStats = () => {
  return useQuery<Record<string, number>>({
    queryKey: ["tickets", "stats"],
    queryFn: getTicketStats,
  });
};
