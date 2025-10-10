"use client";

import { useTicketsByEmployee } from "@/hooks/useTickets";
import { useUser } from '@/context/UserContext';
import TicketCard from "./TicketCard";
import EmployeeStats from "./EmployeeStats";
import type { Ticket } from '@/types/tickets';

export default function EmployeeInfoPanel() {
  // TODO: Replace with session/user context later (use JWT). For now use UserContext
  const { currentEmployeeId } = useUser();
  const employeeId = currentEmployeeId || "EMP-005";

  const { data: tickets, isLoading, isError } = useTicketsByEmployee(employeeId);

  if (isLoading)
    return (
      <aside className="w-1/3 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Loading employee tickets...</p>
      </aside>
    );

  if (isError)
    return (
      <aside className="w-1/3 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-red-500">Error loading employee data.</p>
      </aside>
    );

  return (
    <aside className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* 🔹 Upper Half - Tickets */}
      <div className="flex-1 min-h-[50%] overflow-y-auto p-4 space-y-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          🎫 Assigned Tickets
        </h2>
        {tickets?.data?.length ? (
          <div className="flex flex-col space-y-3 overflow-y-auto max-h-[50vh] pr-2">
            {tickets.data.map((ticket: Ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No active tickets assigned.</p>
        )}
      </div>

      {/* 🔹 Lower Half - Employee Stats */}
      <div className="flex-1 min-h-[50%] overflow-y-auto p-4">
        <EmployeeStats employeeId={employeeId} />
      </div>
    </aside>
  );
}
