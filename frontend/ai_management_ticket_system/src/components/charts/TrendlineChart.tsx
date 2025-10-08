"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

/**
 * ========================================
 * 📈 TrendlineChart Component
 * ========================================
 * Displays efficiency over time using data
 * from analytics endpoints.
 * Expected fields:
 * - fecha_actualizado (x-axis)
 * - eficiencia_temporal (y-axis)
 */

interface TrendlineChartProps {
  data: {
    fecha_actualizado: string;
    eficiencia_temporal: number | null;
  }[];
}

export default function TrendlineChart({ data }: TrendlineChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-sm">No data available for trendline.</div>;
  }

  return (
    <div className="w-full h-64 bg-white p-4 rounded-2xl shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Efficiency Trend</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha_actualizado"
            tickFormatter={(v) => new Date(v).toLocaleDateString("es-CO")}
            stroke="#8884d8"
          />
          <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
          <Line type="monotone" dataKey="eficiencia_temporal" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
