const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/analytics/employee/:id - Employee performance analytics
router.get('/employee/:id', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build date filter
    let dateFilter = '';
    const params = [req.params.id];
    
    if (date_from) {
      params.push(date_from);
      dateFilter += ` AND fecha_creacion >= $${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      dateFilter += ` AND fecha_creacion <= $${params.length}`;
    }

    // Get employee info
    const empResult = await pool.query(
      'SELECT id, nombre, organizacion FROM empleados WHERE id = $1',
      [req.params.id]
    );

    if (empResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Overall performance metrics
    const performanceQuery = `
      SELECT
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as completados,
        COUNT(CASE WHEN estado = 'CANCELADO' THEN 1 END) as cancelados,
        COUNT(CASE WHEN estado IN ('ACTIVO', 'EN_PAUSA') THEN 1 END) as activos,
        
        -- Time metrics
        AVG(CASE WHEN estado = 'COMPLETADO' AND eficiencia_temporal IS NOT NULL
            THEN eficiencia_temporal END) as eficiencia_promedio,
        SUM(CASE WHEN estado = 'COMPLETADO' THEN tiempo_real ELSE 0 END) as horas_trabajadas,
        SUM(tiempo_pausa_total) as total_pausas_horas,
        
        -- Acceptance metrics
        AVG(CASE WHEN fecha_aceptacion IS NOT NULL
            THEN EXTRACT(EPOCH FROM (fecha_aceptacion - fecha_creacion))/3600
            END) as tiempo_aceptacion_promedio_horas,
        
        -- KPI metrics
        COUNT(CASE WHEN jsonb_path_exists(kpis, '$.especificos') THEN 1 END) as tickets_con_kpis,
        AVG(CASE WHEN jsonb_path_exists(kpis, '$.rendimiento.cumplimiento_kpis')
            THEN (kpis->'rendimiento'->>'cumplimiento_kpis')::numeric
            END) as kpi_compliance_avg
            
      FROM tickets
      WHERE asignado_a = $1 ${dateFilter}
    `;

    const perfResult = await pool.query(performanceQuery, params);
    const performance = perfResult.rows[0];

    // Tickets by estado (for visualization)
    const estadoQuery = `
      SELECT 
        estado,
        COUNT(*) as count
      FROM tickets
      WHERE asignado_a = $1 ${dateFilter}
      GROUP BY estado
      ORDER BY count DESC
    `;

    const estadoResult = await pool.query(estadoQuery, params);

    // Efficiency trend (last 10 completed tickets)
    const trendQuery = `
      SELECT 
        id,
        titulo,
        fecha_creacion,
        fecha_actualizado,
        eficiencia_temporal,
        tiempo_estimado,
        tiempo_real
      FROM tickets
      WHERE asignado_a = $1 
        AND estado = 'COMPLETADO'
        ${dateFilter}
      ORDER BY fecha_actualizado DESC
      LIMIT 10
    `;

    const trendResult = await pool.query(trendQuery, params);

    // Tickets returned during review
    const devueltosQuery = `
      SELECT COUNT(*) as count
      FROM tickets
      WHERE asignado_a = $1
        AND jsonb_path_exists(revision, '$.accion')
        AND revision->>'accion' = 'rechazar'
        ${dateFilter}
    `;

    const devueltosResult = await pool.query(devueltosQuery, params);

    res.json({
      employee: empResult.rows[0],
      date_range: {
        from: date_from || 'all',
        to: date_to || 'all'
      },
      performance: {
        total_tickets: parseInt(performance.total_tickets),
        completados: parseInt(performance.completados),
        cancelados: parseInt(performance.cancelados),
        activos: parseInt(performance.activos),
        eficiencia_promedio: performance.eficiencia_promedio 
          ? parseFloat(performance.eficiencia_promedio).toFixed(2) 
          : null,
        horas_trabajadas: parseFloat(performance.horas_trabajadas) || 0,
        total_pausas_horas: parseFloat(performance.total_pausas_horas) || 0,
        tiempo_aceptacion_promedio_horas: performance.tiempo_aceptacion_promedio_horas
          ? parseFloat(performance.tiempo_aceptacion_promedio_horas).toFixed(2)
          : null,
        tickets_con_kpis: parseInt(performance.tickets_con_kpis),
        kpi_compliance_avg: performance.kpi_compliance_avg
          ? parseFloat(performance.kpi_compliance_avg).toFixed(2)
          : null,
        tickets_devueltos: parseInt(devueltosResult.rows[0].count)
      },
      tickets_by_estado: estadoResult.rows,
      efficiency_trend: trendResult.rows
    });
  } catch (error) {
    console.error('Error fetching employee analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/procedure/:codigo - Procedure performance analytics
router.get('/procedure/:codigo', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build date filter
    let dateFilter = '';
    const params = [req.params.codigo];
    
    if (date_from) {
      params.push(date_from);
      dateFilter += ` AND fecha_creacion >= ${params.length}`;
    }
    if (date_to) {
      params.push(date_to);
      dateFilter += ` AND fecha_creacion <= ${params.length}`;
    }

    // Get procedure info
    const procResult = await pool.query(
      'SELECT codigo, nombre, tiempo_estimado_horas, complejidad FROM procedimientos WHERE codigo = $1',
      [req.params.codigo]
    );

    if (procResult.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    // Procedure performance
    const performanceQuery = `
      SELECT
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as completados,
        AVG(CASE WHEN estado = 'COMPLETADO' 
            THEN eficiencia_temporal END) as eficiencia_promedio,
        AVG(CASE WHEN estado = 'COMPLETADO' 
            THEN tiempo_real END) as tiempo_real_promedio,
        AVG(CASE WHEN estado = 'COMPLETADO'
            THEN tiempo_pausa_total END) as tiempo_pausa_promedio,
        
        -- KPI compliance
        COUNT(CASE WHEN jsonb_path_exists(kpis, '$.especificos') THEN 1 END) as tickets_con_kpis,
        AVG(CASE WHEN jsonb_path_exists(kpis, '$.rendimiento.cumplimiento_kpis')
            THEN (kpis->'rendimiento'->>'cumplimiento_kpis')::numeric
            END) as kpi_compliance_avg
            
      FROM tickets
      WHERE codigo_procedimiento = $1 ${dateFilter}
    `;

    const perfResult = await pool.query(performanceQuery, params);
    const performance = perfResult.rows[0];

    // Top performers for this procedure
    const topPerformersQuery = `
      SELECT 
        asignado_a,
        COUNT(*) as tickets_completados,
        AVG(eficiencia_temporal) as eficiencia_promedio
      FROM tickets
      WHERE codigo_procedimiento = $1
        AND estado = 'COMPLETADO'
        ${dateFilter}
      GROUP BY asignado_a
      ORDER BY eficiencia_promedio DESC
      LIMIT 5
    `;

    const topResult = await pool.query(topPerformersQuery, params);

    // Get employee names for top performers
    const employeeIds = topResult.rows.map(r => r.asignado_a);
    let topPerformersWithNames = [];

    if (employeeIds.length > 0) {
      const empQuery = `
        SELECT id, nombre 
        FROM empleados 
        WHERE id = ANY($1::text[])
      `;
      const empResult = await pool.query(empQuery, [employeeIds]);
      const empMap = {};
      empResult.rows.forEach(e => empMap[e.id] = e.nombre);

      topPerformersWithNames = topResult.rows.map(r => ({
        empleado_id: r.asignado_a,
        empleado_nombre: empMap[r.asignado_a] || 'Unknown',
        tickets_completados: parseInt(r.tickets_completados),
        eficiencia_promedio: r.eficiencia_promedio 
          ? parseFloat(r.eficiencia_promedio).toFixed(2)
          : null
      }));
    }

    // Time distribution
    const timeQuery = `
      SELECT 
        CASE 
          WHEN tiempo_real <= tiempo_estimado * 0.8 THEN 'Muy eficiente'
          WHEN tiempo_real <= tiempo_estimado THEN 'Eficiente'
          WHEN tiempo_real <= tiempo_estimado * 1.2 THEN 'En tiempo'
          ELSE 'Retrasado'
        END as categoria,
        COUNT(*) as count
      FROM tickets
      WHERE codigo_procedimiento = $1
        AND estado = 'COMPLETADO'
        ${dateFilter}
      GROUP BY categoria
      ORDER BY count DESC
    `;

    const timeResult = await pool.query(timeQuery, params);

    res.json({
      procedure: procResult.rows[0],
      date_range: {
        from: date_from || 'all',
        to: date_to || 'all'
      },
      performance: {
        total_tickets: parseInt(performance.total_tickets),
        completados: parseInt(performance.completados),
        completion_rate: performance.total_tickets > 0
          ? ((performance.completados / performance.total_tickets) * 100).toFixed(2) + '%'
          : '0%',
        eficiencia_promedio: performance.eficiencia_promedio
          ? parseFloat(performance.eficiencia_promedio).toFixed(2)
          : null,
        tiempo_real_promedio_horas: performance.tiempo_real_promedio
          ? parseFloat(performance.tiempo_real_promedio).toFixed(2)
          : null,
        tiempo_pausa_promedio_horas: performance.tiempo_pausa_promedio
          ? parseFloat(performance.tiempo_pausa_promedio).toFixed(2)
          : null,
        tickets_con_kpis: parseInt(performance.tickets_con_kpis),
        kpi_compliance_avg: performance.kpi_compliance_avg
          ? parseFloat(performance.kpi_compliance_avg).toFixed(2)
          : null
      },
      top_performers: topPerformersWithNames,
      time_distribution: timeResult.rows
    });
  } catch (error) {
    console.error('Error fetching procedure analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/department/:id - Department performance analytics
router.get('/department/:id', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build date filter for tickets
    let dateFilter = '';
    const dateParams = [];
    
    if (date_from) {
      dateParams.push(date_from);
      dateFilter += ` AND t.fecha_creacion >= ${dateParams.length + 1}`;
    }
    if (date_to) {
      dateParams.push(date_to);
      dateFilter += ` AND t.fecha_creacion <= ${dateParams.length + 1}`;
    }

    // Get department info
    const deptResult = await pool.query(
      'SELECT id, nombre FROM departamentos WHERE id = $1',
      [req.params.id]
    );

    if (deptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Department-wide performance
    const performanceQuery = `
      SELECT
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN t.estado = 'COMPLETADO' THEN 1 END) as completados,
        COUNT(CASE WHEN t.estado IN ('ACTIVO', 'EN_PAUSA') THEN 1 END) as activos,
        AVG(CASE WHEN t.estado = 'COMPLETADO' 
            THEN t.eficiencia_temporal END) as eficiencia_promedio,
        SUM(CASE WHEN t.estado = 'COMPLETADO' 
            THEN t.tiempo_real ELSE 0 END) as total_horas_trabajadas,
        COUNT(DISTINCT t.asignado_a) as empleados_activos
        
      FROM tickets t
      JOIN empleados e ON e.id = t.asignado_a
      WHERE e.organizacion->>'departamento' = $1 ${dateFilter}
    `;

    const params = [req.params.id, ...dateParams];
    const perfResult = await pool.query(performanceQuery, params);
    const performance = perfResult.rows[0];

    // Employee performance within department
    const empPerformanceQuery = `
      SELECT 
        e.id,
        e.nombre,
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN t.estado = 'COMPLETADO' THEN 1 END) as completados,
        AVG(CASE WHEN t.estado = 'COMPLETADO' 
            THEN t.eficiencia_temporal END) as eficiencia_promedio
      FROM empleados e
      LEFT JOIN tickets t ON t.asignado_a = e.id ${dateFilter.replace('t.fecha_creacion', 'fecha_creacion')}
      WHERE e.organizacion->>'departamento' = $1
        AND e.activo = true
      GROUP BY e.id, e.nombre
      ORDER BY eficiencia_promedio DESC NULLS LAST
    `;

    const empResult = await pool.query(empPerformanceQuery, params);

    // Workload distribution
    const workloadQuery = `
      SELECT 
        e.nombre as empleado_nombre,
        COUNT(CASE WHEN t.estado IN ('ACTIVO', 'EN_PAUSA') THEN 1 END) as tickets_activos,
        COUNT(CASE WHEN t.estado = 'CREADO' THEN 1 END) as tickets_pendientes
      FROM empleados e
      LEFT JOIN tickets t ON t.asignado_a = e.id
      WHERE e.organizacion->>'departamento' = $1
        AND e.activo = true
      GROUP BY e.id, e.nombre
      ORDER BY tickets_activos DESC
    `;

    const workloadResult = await pool.query(workloadQuery, [req.params.id]);

    res.json({
      department: deptResult.rows[0],
      date_range: {
        from: date_from || 'all',
        to: date_to || 'all'
      },
      performance: {
        total_tickets: parseInt(performance.total_tickets),
        completados: parseInt(performance.completados),
        activos: parseInt(performance.activos),
        completion_rate: performance.total_tickets > 0
          ? ((performance.completados / performance.total_tickets) * 100).toFixed(2) + '%'
          : '0%',
        eficiencia_promedio: performance.eficiencia_promedio
          ? parseFloat(performance.eficiencia_promedio).toFixed(2)
          : null,
        total_horas_trabajadas: parseFloat(performance.total_horas_trabajadas) || 0,
        empleados_activos: parseInt(performance.empleados_activos)
      },
      employee_performance: empResult.rows.map(e => ({
        empleado_id: e.id,
        empleado_nombre: e.nombre,
        total_tickets: parseInt(e.total_tickets),
        completados: parseInt(e.completados),
        eficiencia_promedio: e.eficiencia_promedio
          ? parseFloat(e.eficiencia_promedio).toFixed(2)
          : null
      })),
      workload_distribution: workloadResult.rows.map(w => ({
        empleado_nombre: w.empleado_nombre,
        tickets_activos: parseInt(w.tickets_activos),
        tickets_pendientes: parseInt(w.tickets_pendientes)
      }))
    });
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/analytics/linea/:id - Work line progress analytics
router.get('/linea/:id', async (req, res) => {
  try {
    const { actividad_id } = req.query;

    if (!actividad_id) {
      return res.status(400).json({ 
        error: 'actividad_id query parameter is required' 
      });
    }

    // Get work line info
    const lineaResult = await pool.query(
      'SELECT * FROM lineas_trabajo WHERE id = $1',
      [req.params.id]
    );

    if (lineaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work line not found' });
    }

    const linea = lineaResult.rows[0];

    // Get all tickets in this work line
    const ticketsQuery = `
      SELECT 
        id,
        titulo,
        estado,
        asignado_a,
        tiempo_estimado,
        tiempo_real,
        hito_actual,
        fecha_creacion,
        fecha_actualizado,
        flujo
      FROM tickets
      WHERE codigo_actividad = $1
        AND codigo_linea_trabajo = $2
      ORDER BY fecha_creacion ASC
    `;

    const ticketsResult = await pool.query(ticketsQuery, [actividad_id, req.params.id]);
    const tickets = ticketsResult.rows;

    // Calculate progress
    const totalTickets = tickets.length;
    const completedTickets = tickets.filter(t => t.estado === 'COMPLETADO').length;
    const activeTickets = tickets.filter(t => t.estado === 'ACTIVO').length;
    const pausedTickets = tickets.filter(t => t.estado === 'EN_PAUSA').length;

    const overallProgress = totalTickets > 0 
      ? ((completedTickets / totalTickets) * 100).toFixed(2)
      : '0.00';

    // Calculate total estimated vs actual time
    const totalEstimated = tickets.reduce((sum, t) => sum + (t.tiempo_estimado || 0), 0);
    const totalActual = tickets.filter(t => t.estado === 'COMPLETADO')
      .reduce((sum, t) => sum + (t.tiempo_real || 0), 0);

    // Identify bottlenecks (tickets taking longer than expected)
    const bottlenecks = tickets
      .filter(t => t.estado === 'ACTIVO' && t.tiempo_real > t.tiempo_estimado)
      .map(t => ({
        ticket_id: t.id,
        titulo: t.titulo,
        asignado_a: t.asignado_a,
        tiempo_estimado: t.tiempo_estimado,
        tiempo_actual: t.tiempo_real,
        retraso_horas: t.tiempo_real - t.tiempo_estimado
      }));

    // Dependency analysis
    const blockedTickets = tickets.filter(t => {
      if (t.estado === 'CREADO' && t.flujo?.dependencias) {
        // Check if dependencies are met
        const deps = t.flujo.dependencias;
        
        // Handle both object and array formats
        let depIds = [];
        if (typeof deps === 'object' && !Array.isArray(deps)) {
          // Object format: { "TKT-002": { hito_aprobado: true } }
          depIds = Object.keys(deps);
        } else if (Array.isArray(deps)) {
          // Array format: ["TKT-002", "TKT-003"]
          depIds = deps;
        }
        
        // Check if any dependency is not completed
        return depIds.some(depId => {
          const depTicket = tickets.find(tk => tk.id === depId);
          return depTicket && depTicket.estado !== 'COMPLETADO';
        });
      }
      return false;
    });

    res.json({
      work_line: {
        id: linea.id,
        nombre: linea.nombre,
        tipo: linea.tipo,
        orden: linea.orden
      },
      progress: {
        total_tickets: totalTickets,
        completados: completedTickets,
        activos: activeTickets,
        pausados: pausedTickets,
        pendientes: totalTickets - completedTickets - activeTickets - pausedTickets,
        porcentaje_completado: overallProgress + '%'
      },
      time_metrics: {
        total_estimado_horas: totalEstimated,
        total_real_horas: totalActual,
        diferencia_horas: totalActual - totalEstimated,
        eficiencia: totalEstimated > 0
          ? ((1 - (totalActual / totalEstimated)) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      tickets: tickets.map(t => ({
        id: t.id,
        titulo: t.titulo,
        estado: t.estado,
        asignado_a: t.asignado_a,
        hito_actual: t.hito_actual,
        fecha_creacion: t.fecha_creacion,
        fecha_actualizado: t.fecha_actualizado
      })),
      bottlenecks: bottlenecks,
      blocked_tickets: blockedTickets.map(t => {
        const deps = t.flujo?.dependencias;
        let depIds = [];
        
        if (typeof deps === 'object' && !Array.isArray(deps)) {
          depIds = Object.keys(deps);
        } else if (Array.isArray(deps)) {
          depIds = deps;
        }
        
        return {
          id: t.id,
          titulo: t.titulo,
          dependencias: depIds
        };
      })
    });
  } catch (error) {
    console.error('Error fetching work line analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;