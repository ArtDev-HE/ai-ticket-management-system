import { useState } from 'react';
import { generateVisualizationDescriptor, AiResponse } from '@/services/ai';
import { getEmployeeAnalytics } from '@/services/analytics';
import { getProcedureAnalytics } from '@/services/analytics';
import { getDepartmentAnalytics } from '@/services/analytics';

// Simple command parsing helpers
const regexes = {
  employeeId: /(EMP-[A-Za-z0-9_-]+)/i,
};

export default function ChatInput({ onSend, onUserSend }: { onSend?: (resp: AiResponse) => void; onUserSend?: (text: string) => void }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // do nothing when input is empty
    if (!value || value.trim() === '') return;
    // notify parent that user sent a message
    onUserSend?.(value);

    setLoading(true);
    try {
      console.log('[ChatInput] sending prompt:', value);

      // Command parsing: try handling structured commands first
      const text = value.trim();

      // Example commands:
      // - show efficiency trend EMP-001
      // - show KPI summary for employee EMP-001
      // - show ticket distribution for department DEP-01

      // Employee commands
      const empMatch = text.match(/(EMP-[A-Za-z0-9_-]+)/i);
      const procMatch = text.match(/(PROC-[A-Za-z0-9_-]+)/i);
      const depMatch = text.match(/(DEP-[A-Za-z0-9_-]+)/i);

      if (/trend|efficien|efficiency/i.test(text) && empMatch) {
        const empId = empMatch[1];
        try {
          const analytics = await getEmployeeAnalytics(empId);
          const resp: AiResponse = {
            text: `Efficiency trend for ${empId}`,
            visualization: {
              key: 'trendline_efficiency',
              data: analytics.efficiency_trend || [],
            },
            analytics,
          };
          onSend?.(resp);
          return;
        } catch (err: any) {
          onSend?.({ text: `Error: employee ${empId} not found or analytics unavailable.` });
          return;
        }
      }

      if (/(kpi|summary)/i.test(text) && empMatch) {
        const empId = empMatch[1];
        try {
          const analytics = await getEmployeeAnalytics(empId);
          // ensure completion_rate exists
          const perf = (analytics as any).performance || {} as any;
          const completion_rate = (perf.completion_rate as string) ?? (((perf.completados || 0) / (perf.total_tickets || 1) * 100).toFixed(2) + '%');
          const resp: AiResponse = {
            text: `KPI summary for ${empId}`,
            visualization: {
              key: 'kpireport_summary',
              data: { ...perf, completion_rate },
            },
            analytics,
          };
          onSend?.(resp);
          return;
        } catch (err: any) {
          onSend?.({ text: `Error: employee ${empId} not found or analytics unavailable.` });
          return;
        }
      }

      // Procedure commands
      if (/trend|efficien|efficiency/i.test(text) && procMatch) {
        const proc = procMatch[1];
        try {
          const analytics = await getProcedureAnalytics(proc);
          // Procedure may not have efficiency_trend - check
          if (!analytics || !('time_distribution' in analytics) && !('performance' in analytics)) {
            onSend?.({ text: `Error: procedure ${proc} does not have trend data for this visualization.` });
            return;
          }
          // Try to use performance or other relevant data
          const resp: AiResponse = {
            text: `KPI summary for procedure ${proc}`,
            visualization: {
              key: 'kpireport_summary',
              data: { ...(analytics as any).performance },
            },
            analytics,
          };
          onSend?.(resp);
          return;
        } catch (err: any) {
          onSend?.({ text: `Error: procedure ${proc} not found or analytics unavailable.` });
          return;
        }
      }

      // Department commands
      if (/distribution|estado/i.test(text) && depMatch) {
        const dep = depMatch[1];
        try {
          const analytics = await getDepartmentAnalytics(dep);
          const resp: AiResponse = {
            text: `Ticket distribution for ${dep}`,
            visualization: {
              key: 'barchart_ticket_distribution',
              data: analytics.employee_performance || analytics.workload_distribution || [],
            },
            analytics,
          };
          onSend?.(resp);
          return;
        } catch (err: any) {
          onSend?.({ text: `Error: department ${dep} not found or analytics unavailable.` });
          return;
        }
      }

      // If no command matched, fallback to the AI mock
      const res = await generateVisualizationDescriptor(value);
      console.log('[ChatInput] received AI response:', res);
      onSend?.(res as AiResponse);
    } finally {
      setLoading(false);
    }
    setValue('');
  };

  return (
    <footer className="bg-green-100 p-4 flex items-center relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        type="text"
        placeholder="Type your message to the AI assistant..."
        className="flex-1 p-2 rounded border border-gray-300"
      />
      <button
        disabled={loading}
        onClick={handleSend}
        className="ml-2 bg-green-500 disabled:opacity-50 text-white px-4 py-2 rounded"
      >
        {loading ? 'Thinking...' : 'Send'}
      </button>

      {/* no transient message UI anymore */}
    </footer>
  );
}
