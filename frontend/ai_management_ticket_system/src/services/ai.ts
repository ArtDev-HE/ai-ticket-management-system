/**
 * Mock AI service for development.
 * generateAnswer simulates an AI analysis and returns both a text summary and structured analytics.
 */

export type AiResponse = {
    text: string;
    analytics?: Record<string, unknown>;
    // Optional visualization descriptor for deterministic charts
    visualization?: {
        key: string; // visualization key from VisualizationRegistry
        parameters?: Record<string, unknown>;
        data?: unknown; // optional inline data
        dataUrl?: string; // optional backend endpoint to fetch data from
    };
};

export const generateAnswer = async (prompt: string): Promise<AiResponse> => {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 600));

    // If the prompt is extremely short or looks like a single letter/garbage, return a neutral clarification
    const trimmed = (prompt || '').trim();
    if (trimmed.length <= 2 || /^[a-zA-Z]$/.test(trimmed)) {
        return { text: `I didn't understand that. Could you rephrase or ask for a specific visualization (for example: "show efficiency trend")?` };
    }

    // Simple mock response based on prompt keywords
    const text = `AI summary for: "${prompt.slice(0, 120)}"\n\n- Suggested action: review KPIs\n- Confidence: 72%`;

    const analytics: Record<string, unknown> = {
        performance: {
            total_tickets: 42,
            completados: 26,
            cancelados: 3,
            activos: 13,
            eficiencia_promedio: 82.4,
            kpi_compliance_avg: 76.1,
        },
        tickets_by_estado: [
            { estado: 'ACTIVO', count: 13 },
            { estado: 'COMPLETADO', count: 26 },
            { estado: 'CANCELADO', count: 3 },
        ],
        // raw trend uses percent numbers; we'll keep them here and transform later when producing descriptors
        efficiency_trend: [
            { date: '2025-10-01', eficiencia: 78 },
            { date: '2025-10-02', eficiencia: 80 },
            { date: '2025-10-03', eficiencia: 82 },
            { date: '2025-10-04', eficiencia: 85 },
            { date: '2025-10-05', eficiencia: 84 },
        ],
    };

    return { text, analytics };
};

export const generateVisualizationDescriptor = async (prompt: string): Promise<AiResponse> => {
    const base = await generateAnswer(prompt);
    // Only produce a visualization descriptor when prompt contains explicit visualization intent.
    const intentRE = /\b(show|display|plot|chart|trend|kpi|summary|distribution|visuali|draw|graph)\b/i;
    const hasIntent = intentRE.test(prompt);

    // Naive mapping: if prompt mentions 'trend' or 'efficiency' and user shows intent, return trendline descriptor
    if (hasIntent && /trend|efficien|efficiency|eficien/gi.test(prompt)) {
        // Transform efficiency_trend -> required fields: fecha_actualizado, eficiencia_temporal (0-1)
        const trendRaw = (base.analytics && (base.analytics as unknown as Record<string, unknown>).efficiency_trend) || [];
        const transformed = Array.isArray(trendRaw) ? trendRaw.map((p: unknown) => {
            const rec = p as Record<string, unknown>;
            const fecha = (rec.date as string) || (rec.fecha_actualizado as string) || '';
            const ef = rec.eficiencia ?? rec.eficiencia_temporal ?? rec.value ?? null;
            const eficiencia_temporal = typeof ef === 'number' ? (ef as number) / 100 : null;
            return { fecha_actualizado: fecha, eficiencia_temporal };
        }) : [];

        return {
            text: base.text,
            analytics: base.analytics,
            visualization: {
                key: 'trendline_efficiency',
                parameters: { date_from: '2025-09-01', date_to: '2025-10-01' },
                data: transformed,
            },
        };
    }

    if (hasIntent && /(ticket|estado|distribution|distribution)/i.test(prompt)) {
        return {
            text: base.text,
            analytics: base.analytics,
            visualization: {
                key: 'barchart_ticket_distribution',
                parameters: {},
                data: (base.analytics && (base.analytics as unknown as Record<string, unknown>).tickets_by_estado) || [],
            },
        };
    }
    // If prompt did not express visualization intent, return text-only response (no visualization)
    if (!hasIntent) {
        return {
            text: base.text,
            analytics: base.analytics,
        };
    }

    // If we reach here, user showed intent but no other mapping matched — return a KPI report visualization by default.
    return {
        text: base.text,
        analytics: base.analytics,
        visualization: {
            key: 'kpireport_summary',
            parameters: {},
            data: (() => {
                const perf = base.analytics && (base.analytics as unknown as Record<string, unknown>).performance as Record<string, unknown> | undefined;
                const completadosRaw = perf?.completados;
                const totalRaw = perf?.total_tickets;
                const completados = typeof completadosRaw === 'number' ? completadosRaw : (typeof completadosRaw === 'string' ? Number(completadosRaw) : 0);
                const total = typeof totalRaw === 'number' ? totalRaw : (typeof totalRaw === 'string' ? Number(totalRaw) : 1);
                const completion_rate = ((total && !Number.isNaN(total)) ? ((completados / total) * 100) : 0).toFixed(2) + '%';
                return {
                    ...(perf ?? {}),
                    completion_rate,
                } as Record<string, unknown>;
            })(),
        },
    };
};

export default { generateAnswer };

// Backend query helper — calls /api/ai/query on the server
export const queryAiBackend = async (prompt: string) => {
    const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI backend error: ${res.status} ${text}`);
    }
    return res.json();
};

// Wrapper to choose mock or backend based on env flag (Next.js will inline NEXT_PUBLIC_USE_BACKEND_AI)
export const getAiDescriptor = async (prompt: string) => {
    const useBackend = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_USE_BACKEND_AI === 'true');
    if (useBackend) {
        return queryAiBackend(prompt);
    }
    return generateVisualizationDescriptor(prompt);
};
