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
              const data = descriptor!.data;
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
