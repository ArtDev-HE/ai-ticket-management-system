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

export const useTickets = (filters: Record<string, any> = {}) => {
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
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      // Route to specific endpoints based on payload shape
      if (data?.empleado_id && data?.action === 'accept') {
        return acceptTicket(id, data.empleado_id);
      }
      if (data?.porcentaje !== undefined && data?.completado !== undefined) {
        return updateHito(id, data.porcentaje, data.completado);
      }
      if (data?.accion && (data.accion === 'aprobar' || data.accion === 'rechazar' || data.accion === 'reasignar')) {
        return reviewTicket(id, data);
      }
      if (data?.kpis_especificos) {
        return submitKpis(id, data.kpis_especificos);
      }
      if (data?.pause) {
        return pauseTicket(id, data.pause);
      }
      if (data?.resume) {
        return resumeTicket(id, data.resume);
      }
      if (data?.requestReassignment) {
        const { empleado_id, razon } = data.requestReassignment;
        return requestReassignment(id, empleado_id, razon);
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
      data?: Record<string, any>;
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
  return useQuery<any>({
    queryKey: ["tickets", "stats"],
    queryFn: getTicketStats,
  });
};
