"use client";

import dynamic from "next/dynamic";
import { VisualizationRegistry } from "@/config/VisualizationRegistry";


interface AnalyticsViewProps {
  visualizationKey: keyof typeof VisualizationRegistry;
  // Accept any payload shape — visualizations will validate/render as appropriate
  data: any;
}

export default function AnalyticsView({ visualizationKey, data }: AnalyticsViewProps) {
  const template = VisualizationRegistry[visualizationKey];

  if (!template) {
    return <div className="text-red-500">⚠️ Unknown visualization type.</div>;
  }

  // Lazy-load chart component. We cast to `any` so dynamic import is usable as a React component
  const ChartComponent: any = dynamic(() => import(`@/components/charts/${template.component}`), {
    ssr: false,
  });

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-semibold mb-3">{template.label}</h2>
      <ChartComponent data={data} />
    </div>
  );
}
