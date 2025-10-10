"use client";

import dynamic from "next/dynamic";
import { VisualizationRegistry } from "@/config/VisualizationRegistry";
import React from 'react';


interface AnalyticsViewProps {
  visualizationKey: keyof typeof VisualizationRegistry;
  // Accept unknown payload shape — visualizations will validate/render as appropriate
  data: unknown;
}

export default function AnalyticsView({ visualizationKey, data }: AnalyticsViewProps) {
  const template = VisualizationRegistry[visualizationKey];

  if (!template) {
    return <div className="text-red-500">⚠️ Unknown visualization type.</div>;
  }

  // Lazy-load chart component. Type as React component that accepts a `data` prop of unknown shape.
  const ChartComponent = dynamic(() => import(`@/components/charts/${template.component}`).then((mod) => mod.default || mod), { ssr: false }) as unknown as React.ComponentType<{ data: unknown }>;

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold mb-3">{template.label}</h2>
      <ChartComponent data={data} />
    </div>
  );
}
