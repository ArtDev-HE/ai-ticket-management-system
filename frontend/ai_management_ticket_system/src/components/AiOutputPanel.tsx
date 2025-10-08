"use client";

import React from "react";
import AnalyticsView from "@/components/AnalyticsView";

export default function AiOutputPanel({
  output,
}: {
  output: string | null;
}) {

 // 🚧 Mock backend response
  const mockAnalytics = {
    performance: {
      total_tickets: 10,
      completados: 6,
      cancelados: 1,
      activos: 3,
      eficiencia_promedio: 87.5,
      kpi_compliance_avg: 92.3,
    },
    tickets_by_estado: [
      { estado: "ACTIVO", count: 3 },
      { estado: "COMPLETADO", count: 6 },
      { estado: "CANCELADO", count: 1 },
    ],
    efficiency_trend: [
      { date: "2025-10-01", eficiencia: 78 },
      { date: "2025-10-02", eficiencia: 82 },
      { date: "2025-10-03", eficiencia: 90 },
      { date: "2025-10-04", eficiencia: 88 },
      { date: "2025-10-05", eficiencia: 92 },
    ],
  };

  return (
    <div className="w-1/2 bg-white shadow-inner rounded-lg p-4 overflow-auto">
      {output ? (
        <div className="prose max-w-none">
          <h2 className="text-lg font-semibold mb-2">AI Analysis</h2>
          <pre className="whitespace-pre-wrap text-gray-800">
            {output}
          </pre>
          <>
            <AnalyticsView
              visualizationKey="kpireport_summary"
              data={mockAnalytics.performance}
            />
            <AnalyticsView
              visualizationKey="barchart_ticket_distribution"
              data={mockAnalytics.tickets_by_estado}
            />
            <AnalyticsView
              visualizationKey="trendline_efficiency"
              data={mockAnalytics.efficiency_trend}
            />
          </>

        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No AI analysis yet
        </div>
      )}
    </div>
  );
}
