"use client";

import { useQuery } from "@tanstack/react-query";
import { getEmployeeAnalytics } from "@/services/analytics";
import {
  EmployeeAnalytics,
  EmployeePerformance,
} from "@/types/analytics";

interface EmployeeStatsProps {
  employeeId: string;
}

/**
 * ===========================================
 * 📊 EmployeeStats Component
 * ===========================================
 * Displays performance indicators for a given employee.
 * Pulls real-time analytics from the backend analytics.js route.
 */
export default function EmployeeStats({ employeeId }: EmployeeStatsProps) {
  const { data, isLoading, isError } = useQuery<EmployeeAnalytics>({
    queryKey: ["analytics", "employee", employeeId],
    queryFn: () => getEmployeeAnalytics(employeeId),
    enabled: !!employeeId,
  });

  if (isLoading)
    return (
      <div className="p-4 text-sm text-gray-500">Loading analytics...</div>
    );

  if (isError || !data)
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load employee stats.
      </div>
    );

  const perf: EmployeePerformance = data.performance;

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <h2 className="text-base font-semibold text-gray-800 mb-3">
        📈 Performance Overview
      </h2>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Total Tickets" value={perf.total_tickets} />
        <Stat label="Completed" value={perf.completados} />
        <Stat label="Active" value={perf.activos} />
        <Stat label="Cancelled" value={perf.cancelados} />
        <Stat
          label="Avg Efficiency"
          value={perf.eficiencia_promedio?.toFixed(1) ?? "—"}
          unit="%"
        />
        <Stat
          label="Hours Worked"
          value={perf.horas_trabajadas?.toFixed(1) ?? "—"}
        />
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

/** 🔹 Reusable small metric display */
function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-gray-800 font-medium">
        {value}
        {unit && <span className="text-gray-500 text-xs ml-1">{unit}</span>}
      </span>
    </div>
  );
}
