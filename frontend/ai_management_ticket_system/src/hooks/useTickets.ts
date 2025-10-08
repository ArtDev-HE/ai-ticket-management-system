"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  } = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => getTickets(filters),
  });

  // ─── CREATE a new ticket ───────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });

  // ─── UPDATE an existing ticket ─────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      updateTicket(id, data),
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
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => (id ? getTicketById(id) : null),
    enabled: !!id,
  });
};

/**
 * 👷‍♂️ useTicketsByEmployee - Get tickets for specific employee
 */
export const useTicketsByEmployee = (employeeId?: string) => {
  return useQuery({
    queryKey: ["tickets", "employee", employeeId],
    queryFn: () => (employeeId ? getTicketsByEmployee(employeeId) : []),
    enabled: !!employeeId,
  });
};

/**
 * 📊 useTicketStats - Dashboard overview
 */
export const useTicketStats = () => {
  return useQuery({
    queryKey: ["tickets", "stats"],
    queryFn: getTicketStats,
  });
};
