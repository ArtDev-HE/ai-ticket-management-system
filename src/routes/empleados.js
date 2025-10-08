const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/empleados - Get all employees
router.get('/', async (req, res) => {
  try {
    const { activo, departamento, nivel, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM empleados WHERE 1=1';
    const params = [];

    // Filter by active status
    if (activo !== undefined) {
      params.push(activo === 'true');
      query += ` AND activo = $${params.length}`;
    }

    // Filter by department (from organizacion JSONB)
    if (departamento) {
      params.push(departamento);
      query += ` AND organizacion->>'departamento' = $${params.length}`;
    }

    // Filter by nivel (from organizacion JSONB)
    if (nivel) {
      params.push(nivel);
      query += ` AND organizacion->>'nivel' = $${params.length}`;
    }

    // Add ordering and pagination
    params.push(limit, offset);
    query += ` ORDER BY nombre ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching empleados:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/empleados/:id - Get single employee
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM empleados WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching empleado:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/empleados/:id/workload - Get employee workload and performance
router.get('/:id/workload', async (req, res) => {
  try {
    // First verify employee exists
    const empleadoCheck = await pool.query(
      'SELECT id, nombre FROM empleados WHERE id = $1',
      [req.params.id]
    );

    if (empleadoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado not found' });
    }

    // Get comprehensive workload data
    const workloadQuery = `
      SELECT
        -- Current active workload
        COUNT(CASE WHEN estado IN ('ACTIVO', 'EN_PAUSA') THEN 1 END) as tickets_activos,
        COUNT(CASE WHEN estado = 'CREADO' THEN 1 END) as tickets_pendientes,
        COUNT(CASE WHEN estado = 'EN_REVISION' THEN 1 END) as tickets_en_revision,
        COUNT(CASE WHEN estado = 'COMPLETADO' THEN 1 END) as tickets_completados,
        COUNT(CASE WHEN estado = 'CANCELADO' THEN 1 END) as tickets_cancelados,
        
        -- Time metrics
        SUM(CASE WHEN estado IN ('ACTIVO', 'EN_PAUSA') 
            THEN tiempo_estimado ELSE 0 END) as horas_estimadas_activos,
        SUM(CASE WHEN estado = 'COMPLETADO' 
            THEN tiempo_real ELSE 0 END) as horas_reales_completados,
        
        -- Performance metrics
        AVG(CASE WHEN estado = 'COMPLETADO' AND eficiencia_temporal IS NOT NULL
            THEN eficiencia_temporal ELSE NULL END) as eficiencia_promedio,
        
        -- Pause time
        SUM(CASE WHEN estado IN ('ACTIVO', 'EN_PAUSA', 'COMPLETADO')
            THEN tiempo_pausa_total ELSE 0 END) as tiempo_pausa_total,
        
        -- KPI metrics
        COUNT(CASE WHEN estado = 'COMPLETADO' AND 
              jsonb_path_exists(kpis, '$.especificos') THEN 1 END) as tickets_con_kpis,
        
        -- Count total tickets
        COUNT(*) as total_tickets
        
      FROM tickets
      WHERE asignado_a = $1
    `;

    const workloadResult = await pool.query(workloadQuery, [req.params.id]);
    const workload = workloadResult.rows[0];

    // Get recent ticket activity (last 10 tickets)
    const recentTicketsQuery = `
      SELECT 
        id, 
        titulo, 
        estado, 
        fecha_creacion,
        fecha_actualizado,
        tiempo_estimado,
        tiempo_real,
        eficiencia_temporal,
        hito_actual
      FROM tickets
      WHERE asignado_a = $1
      ORDER BY fecha_actualizado DESC
      LIMIT 10
    `;

    const recentResult = await pool.query(recentTicketsQuery, [req.params.id]);

    // Calculate derived metrics
    const hasActiveTicket = parseInt(workload.tickets_activos) > 0;
    const canAcceptNew = parseInt(workload.tickets_activos) === 0; // One active ticket rule
    
    // Format response
    res.json({
      empleado: {
        id: empleadoCheck.rows[0].id,
        nombre: empleadoCheck.rows[0].nombre
      },
      workload: {
        current: {
          activos: parseInt(workload.tickets_activos),
          pendientes: parseInt(workload.tickets_pendientes),
          en_revision: parseInt(workload.tickets_en_revision),
          can_accept_new: canAcceptNew,
          horas_comprometidas: parseFloat(workload.horas_estimadas_activos) || 0
        },
        historical: {
          completados: parseInt(workload.tickets_completados),
          cancelados: parseInt(workload.tickets_cancelados),
          total: parseInt(workload.total_tickets)
        },
        performance: {
          eficiencia_promedio: workload.eficiencia_promedio 
            ? parseFloat(workload.eficiencia_promedio).toFixed(2) 
            : null,
          horas_reales_trabajadas: parseFloat(workload.horas_reales_completados) || 0,
          tiempo_pausas_total: parseFloat(workload.tiempo_pausa_total) || 0,
          tickets_con_kpis: parseInt(workload.tickets_con_kpis)
        }
      },
      recent_activity: recentResult.rows
    });
  } catch (error) {
    console.error('Error fetching workload:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/empleados - Create new employee
router.post('/', async (req, res) => {
  try {
    const {
      id,
      nombre,
      email,
      activo = true,
      organizacion,
      permisos,
      competencias,
      historial
    } = req.body;

    // Validate required fields
    if (!id || !nombre || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, nombre, email' 
      });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const result = await pool.query(
      `INSERT INTO empleados (
        id, nombre, email, activo,
        organizacion, permisos, competencias, historial
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        id, nombre, email, activo,
        JSON.stringify(organizacion || {}),
        JSON.stringify(permisos || {}),
        JSON.stringify(competencias || {}),
        JSON.stringify(historial || {})
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating empleado:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Empleado with this email already exists' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/empleados/:id - Update employee
router.patch('/:id', async (req, res) => {
  try {
    const {
      nombre,
      email,
      activo,
      organizacion,
      permisos,
      competencias,
      historial
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramCount}`);
      params.push(nombre);
      paramCount++;
    }
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updates.push(`email = $${paramCount}`);
      params.push(email);
      paramCount++;
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount}`);
      params.push(activo);
      paramCount++;
    }
    if (organizacion !== undefined) {
      updates.push(`organizacion = $${paramCount}`);
      params.push(JSON.stringify(organizacion));
      paramCount++;
    }
    if (permisos !== undefined) {
      updates.push(`permisos = $${paramCount}`);
      params.push(JSON.stringify(permisos));
      paramCount++;
    }
    if (competencias !== undefined) {
      updates.push(`competencias = $${paramCount}`);
      params.push(JSON.stringify(competencias));
      paramCount++;
    }
    if (historial !== undefined) {
      updates.push(`historial = $${paramCount}`);
      params.push(JSON.stringify(historial));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Always update timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id as last parameter
    params.push(req.params.id);

    const query = `
      UPDATE empleados 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating empleado:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Email already in use by another employee' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/empleados/:id - Soft delete (set activo = false)
router.delete('/:id', async (req, res) => {
  try {
    // Check if employee has active tickets
    const activeTicketsCheck = await pool.query(
      `SELECT COUNT(*) as active_count 
       FROM tickets 
       WHERE asignado_a = $1 AND estado IN ('ACTIVO', 'EN_PAUSA', 'CREADO')`,
      [req.params.id]
    );

    const activeCount = parseInt(activeTicketsCheck.rows[0].active_count);
    
    if (activeCount > 0) {
      return res.status(400).json({ 
        error: `Cannot deactivate employee with ${activeCount} active ticket(s). Please reassign tickets first.` 
      });
    }

    const result = await pool.query(
      `UPDATE empleados 
       SET activo = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Empleado not found' });
    }

    res.json({ 
      message: 'Empleado deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting empleado:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/empleados/:id/tickets - Get all tickets for an employee
router.get('/:id/tickets', async (req, res) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM tickets WHERE asignado_a = $1';
    const params = [req.params.id];

    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY fecha_actualizado DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching employee tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;