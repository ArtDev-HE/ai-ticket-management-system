"use client";

import React from "react";

/**
 * ========================================
 * 📋 KPIReport Component
 * ========================================
 * Displays key performance metrics in info cards.
 * Expected data: object with KPI values (from analytics API).
 */

interface KPIReportProps {
  data: {
    total_tickets?: number;
    completados?: number;
    completion_rate?: string;
    eficiencia_promedio?: number | null;
    kpi_compliance_avg?: number | null;
  };
}

const Card = ({ title, value, accent }: { title: string; value?: string | number | null; accent: string }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-sm bg-white border-t-4 ${accent} min-w-[140px]`}>
    <p className="text-sm font-semibold text-gray-500">{title}</p>
    <p className="text-lg font-bold text-gray-800 mt-1">{value ?? ""}</p>
  </div>
);

export default function KPIReport({ data }: KPIReportProps) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="text-gray-500 text-sm">No KPI data available.</div>;
  }

  const metrics = [
    { title: "Total Tickets", value: data.total_tickets, accent: "border-blue-400" },
    { title: "Completed", value: data.completados, accent: "border-green-400" },
    { title: "Completion Rate", value: data.completion_rate, accent: "border-indigo-400" },
    { title: "Efficiency Avg", value: data.eficiencia_promedio?.toFixed(2) ?? "—", accent: "border-yellow-400" },
    { title: "KPI Compliance", value: data.kpi_compliance_avg?.toFixed(2) ?? "—", accent: "border-pink-400" },
  ];

  return (
    <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-2xl shadow-inner">
      {metrics.map((m) => (
        <Card key={m.title} title={m.title} value={m.value as any} accent={m.accent} />
      ))}
    </div>
  );
}
