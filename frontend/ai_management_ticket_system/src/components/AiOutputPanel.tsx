"use client";

import React from "react";
import AnalyticsView from "@/components/AnalyticsView";
import type { AiResponse } from "@/services/ai";
import { validateVisualizationData } from "@/utils/visualizationValidator";

export default function AiOutputPanel({
  output,
}: {
  output: string | AiResponse | null;
}) {
  // If output is an object with visualization descriptor, render the registered visualization
  const isResponse = output && typeof output === 'object' && (output as any).visualization;
  const descriptor = isResponse ? (output as AiResponse).visualization : null;
  const text = isResponse ? (output as AiResponse).text : (typeof output === 'string' ? output : null);

  return (
    <div className="w-full bg-white shadow-inner rounded-lg p-4 overflow-auto">
      {output ? (
        <div className="prose max-w-none">
          <h2 className="text-lg font-semibold mb-2">AI Analysis</h2>

          {text && (
            <pre className="whitespace-pre-wrap text-gray-800">{text}</pre>
          )}

          {descriptor ? (
            (() => {
              const key = descriptor!.key;
              const rawData = descriptor!.data;
              // sanitize data: prevent AI from injecting `title` or `label` fields that
              // could accidentally override chart headings
              let data: any = rawData;
              if (Array.isArray(rawData)) {
                data = rawData.map((item: any) => {
                  const { title, label, ...rest } = item || {};
                  return rest;
                });
              } else if (rawData && typeof rawData === 'object') {
                const { title, label, ...rest } = rawData as any;
                data = rest;
              }
              // Normalization for trendline_efficiency: accept {date,value} shape
              if (key === 'trendline_efficiency' && Array.isArray(data)) {
                const looksLikeDateValue = data.length > 0 && data[0] && data[0].date && (data[0].value !== undefined);
                if (looksLikeDateValue) {
                  data = data.map((d: any) => ({
                    fecha_actualizado: d.date,
                    eficiencia_temporal: (typeof d.value === 'number') ? (d.value / 100) : (d.value ? Number(d.value) / 100 : null),
                    // preserve other fields if present
                    ...Object.keys(d).reduce((acc: any, k: string) => {
                      if (k !== 'date' && k !== 'value') acc[k] = d[k];
                      return acc;
                    }, {}),
                  }));
                }
              }
              console.log('[AiOutputPanel] descriptor', descriptor);
              const validation = validateVisualizationData(key, data);
              console.log('[AiOutputPanel] validation', validation);
              if (!validation.valid) {
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <strong>Visualization validation failed:</strong>
                    <div>Missing fields: {validation.missing?.join(', ')}</div>
                    <div className="mt-2 text-sm text-gray-600">AI suggested visualization: {key}</div>
                  </div>
                );
              }

              return <AnalyticsView visualizationKey={key} data={data} />;
            })()
          ) : null}

        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No AI analysis yet
        </div>
      )}
    </div>
  );
}
