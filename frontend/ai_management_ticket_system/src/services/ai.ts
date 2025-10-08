/**
 * Mock AI service for development.
 * generateAnswer simulates an AI analysis and returns both a text summary and structured analytics.
 */

export type AiResponse = {
    text: string;
    analytics?: any;
    // Optional visualization descriptor for deterministic charts
    visualization?: {
        key: string; // visualization key from VisualizationRegistry
        parameters?: Record<string, any>;
        data?: any; // optional inline data
        dataUrl?: string; // optional backend endpoint to fetch data from
    };
};

export const generateAnswer = async (prompt: string): Promise<AiResponse> => {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 600));

    // Simple mock response based on prompt keywords
    const text = `AI summary for: "${prompt.slice(0, 120)}"\n\n- Suggested action: review KPIs\n- Confidence: 72%`;

    const analytics = {
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

    // Naive mapping: if prompt mentions 'trend' or 'efficiency', return trendline descriptor
    if (/trend|efficien|efficiency|eficien/gi.test(prompt)) {
        // Transform efficiency_trend -> required fields: fecha_actualizado, eficiencia_temporal (0-1)
        const transformed = (base.analytics.efficiency_trend || []).map((p: any) => ({
            fecha_actualizado: p.date,
            eficiencia_temporal: typeof p.eficiencia === 'number' ? (p.eficiencia / 100) : null,
        }));

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

    if (/ticket|estado|distribution|distribution/i.test(prompt)) {
        return {
            text: base.text,
            analytics: base.analytics,
            visualization: {
                key: 'barchart_ticket_distribution',
                parameters: {},
                data: base.analytics.tickets_by_estado,
            },
        };
    }

    // Default to KPI report
    return {
        text: base.text,
        analytics: base.analytics,
        visualization: {
            key: 'kpireport_summary',
            parameters: {},
            data: {
                ...base.analytics.performance,
                // add completion_rate as string percentage
                completion_rate: ((base.analytics.performance.completados || 0) / (base.analytics.performance.total_tickets || 1) * 100).toFixed(2) + '%',
            },
        },
    };
};

export default { generateAnswer };
