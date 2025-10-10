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
  const isResponse = output && typeof output === 'object' && ((output as Record<string, unknown>).visualization !== undefined);
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
              const rawData = descriptor!.data as unknown;
              // sanitize data: prevent AI from injecting `title` or `label` fields that
              // could accidentally override chart headings
              let data: unknown = rawData;
              if (Array.isArray(rawData)) {
                data = (rawData as Array<Record<string, unknown>>).map((item) => {
                  const { title, label, ...rest } = item || {} as Record<string, unknown>;
                  return rest;
                });
              } else if (rawData && typeof rawData === 'object') {
                const { title, label, ...rest } = rawData as Record<string, unknown>;
                data = rest;
              }
              // Normalization for trendline_efficiency: accept {date,value} shape
              if (key === 'trendline_efficiency' && Array.isArray(data)) {
                const arr = data as Array<Record<string, unknown>>;
                const looksLikeDateValue = arr.length > 0 && arr[0] && ('date' in arr[0]) && ('value' in (arr[0] as Record<string, unknown>));
                if (looksLikeDateValue) {
                  data = arr.map((d) => {
                    const item = d as Record<string, unknown>;
                    const fecha = typeof item.date === 'string' ? item.date as string : (typeof item.fecha_actualizado === 'string' ? item.fecha_actualizado as string : '');
                    const rawVal = item.value ?? item.eficiencia ?? item.eficiencia_temporal ?? null;
                    let eficiencia: number | null = null;
                    if (typeof rawVal === 'number') eficiencia = rawVal / 100;
                    else if (typeof rawVal === 'string') {
                      const n = Number(rawVal);
                      eficiencia = Number.isNaN(n) ? null : n / 100;
                    }
                    const preserved = Object.keys(item).reduce((acc: Record<string, unknown>, k: string) => {
                      if (k !== 'date' && k !== 'value' && k !== 'eficiencia' && k !== 'eficiencia_temporal' && k !== 'fecha_actualizado') acc[k] = item[k];
                      return acc;
                    }, {});
                    return {
                      fecha_actualizado: fecha,
                      eficiencia_temporal: eficiencia,
                      ...preserved,
                    };
                  });
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
