/**
 * ========================================
 * 📊 Visualization Registry
 * ========================================
 * Defines the templates, rules, and metadata
 * for all analytics visualizations.
 * 
 * The AI layer will select entries from this registry
 * when interpreting user queries (Phase 5).
 */

export interface VisualizationTemplate {
  label: string;
  type: "line" | "bar" | "pie" | "report" | "dashboard";
  component: string; // component name in /components/charts
  requiredFields: string[];
  validFor: ("employee" | "procedure" | "department" | "work_line")[];
  description?: string;
}

export const VisualizationRegistry: Record<string, VisualizationTemplate> = {
  trendline_efficiency: {
    label: "Efficiency Over Time",
    type: "line",
    component: "TrendlineChart",
    requiredFields: ["fecha_actualizado", "eficiencia_temporal"],
    validFor: ["employee", "procedure"],
    description:
      "Displays efficiency progression over time for a given employee or procedure.",
  },

  barchart_ticket_distribution: {
    label: "Tickets by Estado",
    type: "bar",
    component: "EstadoBarChart",
    requiredFields: ["estado", "count"],
    validFor: ["employee", "department"],
    description:
      "Shows ticket distribution across states (Activo, En Pausa, Completado, etc.).",
  },

  kpireport_summary: {
    label: "KPI Summary Report",
    type: "report",
    component: "KPIReport",
    requiredFields: [
      "total_tickets",
      "completados",
      "completion_rate",
      "eficiencia_promedio",
      "kpi_compliance_avg",
    ],
    validFor: ["employee", "department", "procedure"],
    description:
    "Summarizes key performance metrics such as total tickets, completion rate, and efficiency.",
  },

};
