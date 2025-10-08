"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";

/**
 * ========================================
 * 📊 EstadoBarChart Component
 * ========================================
 * Displays ticket distribution by state (estado)
 * Expected data: [{ estado: string, count: number }]
 */

interface EstadoBarChartProps {
  data: {
    estado: string;
    count: number;
  }[];
}

export default function EstadoBarChart({ data }: EstadoBarChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No ticket distribution data available.</div>;
  }

  // Sort by count (descending)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="w-full h-64 bg-white p-4 rounded-2xl shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tickets by Estado</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="estado"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(v: number) => `${v} tickets`} />
          <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
