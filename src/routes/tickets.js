const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================
// EXISTING ENDPOINTS (Phase 2)
// ============================================

// GET /api/tickets - Get all tickets with filters
router.get('/', async (req, res) => {
  try {
    const { estado, asignado_a, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }
    if (asignado_a) {
      params.push(asignado_a);
      query += ` AND asignado_a = $${params.length}`;
    }

    params.push(limit, offset);
    query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets - Create new ticket
router.post('/', async (req, res) => {
  try {
    const {
      id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento,
      titulo, descripcion, asignado_a, asignado_por, tiempo_estimado,
      flujo, hitos, kpis, recursos, metadatos, triggers
    } = req.body;

    if (!id || !codigo_actividad || !titulo || !tiempo_estimado) {
      return res.status(400).json({ error: 'Missing required fields: id, codigo_actividad, titulo, tiempo_estimado' });
    }

    const result = await pool.query(
      `INSERT INTO tickets (
        id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento,
        titulo, descripcion, asignado_a, asignado_por,
        tiempo_estimado, estado, flujo, hitos, kpis, recursos, metadatos, triggers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento,
       titulo, descripcion, asignado_a, asignado_por,
       tiempo_estimado, 'CREADO',
       JSON.stringify(flujo || {}),
       JSON.stringify(hitos || []),
       JSON.stringify(kpis || {}),
       JSON.stringify(recursos || {}),
       JSON.stringify(metadatos || {}),
       JSON.stringify(triggers || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ticket ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/accept - Employee accepts ticket
router.patch('/:id/accept', async (req, res) => {
  try {
    const { empleado_id } = req.body;

    if (!empleado_id) {
      return res.status(400).json({ error: 'empleado_id is required' });
    }

    const result = await pool.query(
      `UPDATE tickets
       SET estado = 'ACTIVO',
           fecha_aceptacion = CURRENT_TIMESTAMP,
           asignado_a = $1,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $2 AND estado = 'CREADO'
       RETURNING *`,
      [empleado_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found or already accepted' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error accepting ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/hito - Update milestone completion
router.patch('/:id/hito', async (req, res) => {
  try {
    const { porcentaje, completado } = req.body;

    if (porcentaje === undefined || completado === undefined) {
      return res.status(400).json({ error: 'porcentaje and completado are required' });
    }

    const ticket = await pool.query('SELECT hitos, estado FROM tickets WHERE id = $1', [req.params.id]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.rows[0].estado !== 'ACTIVO') {
      return res.status(400).json({ error: 'Can only update hitos for ACTIVO tickets' });
    }

    const hitos = ticket.rows[0].hitos;
    const hitoIndex = hitos.findIndex(h => h.porcentaje === porcentaje);
    
    if (hitoIndex === -1) {
      return res.status(404).json({ error: `Hito ${porcentaje}% not found` });
    }

    hitos[hitoIndex].completado = completado;
    if (completado) {
      hitos[hitoIndex].fecha_completado = new Date().toISOString();
    }

    const newEstado = (porcentaje === 100 && completado) ? 'EN_REVISION' : 'ACTIVO';

    const result = await pool.query(
      `UPDATE tickets
       SET hitos = $1,
           hito_actual = $2,
           estado = $3,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [JSON.stringify(hitos), porcentaje, newEstado, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating hito:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/estado - Update ticket state
router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;

    const validStates = ['CREADO', 'ACTIVO', 'EN_PAUSA', 'EN_REVISION', 'COMPLETADO', 'CANCELADO'];
    if (!validStates.includes(estado)) {
      return res.status(400).json({ error: 'Invalid estado' });
    }

    const result = await pool.query(
      `UPDATE tickets
       SET estado = $1,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [estado, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating estado:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/request-reassignment - Employee requests reassignment
router.patch('/:id/request-reassignment', async (req, res) => {
  try {
    const { empleado_id, razon } = req.body;

    // Validation
    if (!empleado_id || !razon) {
      return res.status(400).json({ 
        error: 'Missing required fields: empleado_id, razon' 
      });
    }

    // Get ticket
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Validate ticket state
    if (ticket.estado !== 'ACTIVO') {
      return res.status(400).json({ 
        error: 'Can only request reassignment for ACTIVO tickets' 
      });
    }

    // Validate employee is assigned to ticket
    if (ticket.asignado_a !== empleado_id) {
      return res.status(403).json({ 
        error: 'Only assigned employee can request reassignment' 
      });
    }

    // Update metadatos with reassignment request
    const metadatos = ticket.metadatos || {};
    metadatos.reassignment_requested = true;
    metadatos.reassignment_reason = razon;
    metadatos.reassignment_requested_by = empleado_id;
    metadatos.reassignment_requested_at = new Date().toISOString();

    // Update ticket to EN_REVISION state without changing hito
    const result = await pool.query(
      `UPDATE tickets
       SET estado = 'EN_REVISION',
           metadatos = $1,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(metadatos), req.params.id]
    );

    res.json({
      ticket: result.rows[0],
      message: 'Reassignment requested. Waiting for director approval.'
    });
  } catch (error) {
    console.error('Error requesting reassignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NEW ADVANCED ENDPOINTS (Phase 3 Extended)
// ============================================

// POST /api/tickets/:id/review - Director reviews completed work
router.post('/:id/review', async (req, res) => {
  try {
    const { 
      revisor_id,
      accion, // 'aprobar', 'rechazar', 'reasignar'
      feedback,
      hito_porcentaje, // Which hito is being reviewed
      nuevo_asignado // Only for 'reasignar'
    } = req.body;

    // Validation
    if (!revisor_id || !accion || !feedback) {
      return res.status(400).json({ 
        error: 'Missing required fields: revisor_id, accion, feedback' 
      });
    }

    const validActions = ['aprobar', 'rechazar', 'reasignar'];
    if (!validActions.includes(accion)) {
      return res.status(400).json({ 
        error: 'accion must be: aprobar, rechazar, or reasignar' 
      });
    }

    if (accion === 'reasignar' && !nuevo_asignado) {
      return res.status(400).json({ 
        error: 'nuevo_asignado is required for reasignar action' 
      });
    }

    // Get current ticket
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    if (ticket.estado !== 'EN_REVISION') {
      return res.status(400).json({ 
        error: 'Can only review tickets in EN_REVISION state' 
      });
    }

    // Prepare revision object
    const revision = {
      feedback: feedback,
      aprobado: accion === 'aprobar',
      fecha: new Date().toISOString(),
      revisor: revisor_id,
      accion: accion
    };

    let newEstado;
    let hitoAprobado = ticket.hito_aprobado;
    let newAsignado = ticket.asignado_a;

    switch (accion) {
      case 'aprobar':
        newEstado = 'COMPLETADO';
        hitoAprobado = hito_porcentaje || ticket.hito_actual;
        break;
      
      case 'rechazar':
        newEstado = 'ACTIVO';
        // Reset the rejected hito
        if (hito_porcentaje) {
          const hitos = ticket.hitos;
          const hitoIndex = hitos.findIndex(h => h.porcentaje === hito_porcentaje);
          if (hitoIndex !== -1) {
            hitos[hitoIndex].completado = false;
            hitos[hitoIndex].aprobado = false;
            delete hitos[hitoIndex].fecha_completado;
          }
          
          await pool.query(
            'UPDATE tickets SET hitos = $1 WHERE id = $2',
            [JSON.stringify(hitos), req.params.id]
          );
        }
        break;
      
      case 'reasignar':
        newEstado = 'CREADO';
        newAsignado = nuevo_asignado;
        
        // Clear reassignment request if it exists and move to history
        if (ticket.metadatos?.reassignment_requested) {
          const metadatos = ticket.metadatos;
          
          // Move to history
          metadatos.reassignment_history = metadatos.reassignment_history || [];
          metadatos.reassignment_history.push({
            reason: metadatos.reassignment_reason,
            requested_by: metadatos.reassignment_requested_by,
            requested_at: metadatos.reassignment_requested_at,
            resolved_by: revisor_id,
            resolved_at: new Date().toISOString(),
            previous_assignee: ticket.asignado_a,
            new_assignee: nuevo_asignado
          });
          
          // Clear active request flags
          delete metadatos.reassignment_requested;
          delete metadatos.reassignment_reason;
          delete metadatos.reassignment_requested_by;
          delete metadatos.reassignment_requested_at;
          
          // Update metadatos in database
          await pool.query(
            'UPDATE tickets SET metadatos = $1 WHERE id = $2',
            [JSON.stringify(metadatos), req.params.id]
          );
        }
        
        // Clear acceptance date on reassignment
        await pool.query(
          'UPDATE tickets SET fecha_aceptacion = NULL WHERE id = $1',
          [req.params.id]
        );
        break;
    }

    // Update ticket with review
    const result = await pool.query(
      `UPDATE tickets
       SET revision = $1,
           estado = $2,
           hito_aprobado = $3,
           asignado_a = $4,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        JSON.stringify(revision),
        newEstado,
        hitoAprobado,
        newAsignado,
        req.params.id
      ]
    );

    res.json({
      ticket: result.rows[0],
      message: `Ticket ${accion === 'aprobar' ? 'approved' : accion === 'rechazar' ? 'rejected' : 'reassigned'} successfully`
    });
  } catch (error) {
    console.error('Error reviewing ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/:id/kpis - Collect procedure-specific KPIs
router.post('/:id/kpis', async (req, res) => {
  try {
    const { kpis_especificos } = req.body;

    if (!kpis_especificos || typeof kpis_especificos !== 'object') {
      return res.status(400).json({ 
        error: 'kpis_especificos object is required' 
      });
    }

    // Get ticket and procedure
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Get procedure to validate KPIs
    const procedureResult = await pool.query(
      'SELECT kpis FROM procedimientos WHERE codigo = $1',
      [ticket.codigo_procedimiento]
    );

    if (procedureResult.rows.length === 0) {
      return res.status(404).json({ error: 'Procedure not found' });
    }

    const procedureKpis = procedureResult.rows[0].kpis || {};

    // Convert array format to object format if needed
    let procedureKpisObj = {};
    if (Array.isArray(procedureKpis)) {
      // Array format: [{ nombre: "x", meta: 8, tipo: "resultado" }]
      procedureKpis.forEach(kpi => {
        if (kpi.nombre) {
          procedureKpisObj[kpi.nombre] = {
            meta: kpi.meta,
            tipo: kpi.tipo
          };
        }
      });
    } else {
      // Object format: { "x": { meta: 8, tipo: "resultado" } }
      procedureKpisObj = procedureKpis;
    }

    // Validate that submitted KPIs match procedure definition
    const missingKpis = [];
    for (const kpiName in procedureKpisObj) {
      if (!(kpiName in kpis_especificos)) {
        missingKpis.push(kpiName);
      }
    }

    if (missingKpis.length > 0) {
      return res.status(400).json({ 
        error: `Missing required KPIs: ${missingKpis.join(', ')}`,
        required_kpis: Object.keys(procedureKpisObj)
      });
    }

    // Calculate KPI compliance
    let totalKpis = 0;
    let metKpis = 0;

    for (const kpiName in kpis_especificos) {
      const kpiData = kpis_especificos[kpiName];
      const procedureKpi = procedureKpisObj[kpiName];

      if (procedureKpi && procedureKpi.meta !== undefined) {
        totalKpis++;
        if (kpiData.valor >= procedureKpi.meta) {
          metKpis++;
        }
      }
    }

    const cumplimientoKpis = totalKpis > 0 ? (metKpis / totalKpis) : 0;

    // Update ticket with KPIs
    const updatedKpis = {
      especificos: kpis_especificos,
      rendimiento: {
        eficiencia_temporal: ticket.eficiencia_temporal,
        cumplimiento_kpis: cumplimientoKpis
      }
    };

    const result = await pool.query(
      `UPDATE tickets
       SET kpis = $1,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(updatedKpis), req.params.id]
    );

    res.json({
      ticket: result.rows[0],
      kpi_summary: {
        total_kpis: totalKpis,
        kpis_met: metKpis,
        compliance_rate: (cumplimientoKpis * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('Error collecting KPIs:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/pause - Pause ticket (with cross-director approval logic)
router.patch('/:id/pause', async (req, res) => {
  try {
    const {
      solicitante_id, // Who is requesting the pause
      razon, // Reason for pause
      aprobador_id // Required if cross-directoral
    } = req.body;

    if (!solicitante_id || !razon) {
      return res.status(400).json({ 
        error: 'Missing required fields: solicitante_id, razon' 
      });
    }

    // Get ticket
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    if (ticket.estado !== 'ACTIVO') {
      return res.status(400).json({ 
        error: 'Can only pause ACTIVO tickets' 
      });
    }

    // Check if cross-directoral approval needed
    const needsApproval = ticket.asignado_por !== solicitante_id;

    if (needsApproval && !aprobador_id) {
      return res.status(400).json({ 
        error: 'Cross-directoral pause requires aprobador_id',
        requires_approval: true,
        original_director: ticket.asignado_por
      });
    }

    // Create pause metadata
    const pauseMetadata = {
      razon: razon,
      solicitante: solicitante_id,
      aprobador: aprobador_id || null,
      fecha_pausa: new Date().toISOString(),
      requirio_aprobacion: needsApproval
    };

    // Update ticket to paused state
    const result = await pool.query(
      `UPDATE tickets
       SET estado = 'EN_PAUSA',
           metadatos = jsonb_set(
             COALESCE(metadatos, '{}'::jsonb),
             '{pausa_actual}',
             $1::jsonb
           ),
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(pauseMetadata), req.params.id]
    );

    res.json({
      ticket: result.rows[0],
      message: 'Ticket paused successfully',
      pause_info: pauseMetadata
    });
  } catch (error) {
    console.error('Error pausing ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tickets/:id/resume - Resume paused ticket with deadline extension
router.patch('/:id/resume', async (req, res) => {
  try {
    const { reanudado_por } = req.body;

    if (!reanudado_por) {
      return res.status(400).json({ 
        error: 'reanudado_por is required' 
      });
    }

    // Get ticket
    const ticketResult = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [req.params.id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    if (ticket.estado !== 'EN_PAUSA') {
      return res.status(400).json({ 
        error: 'Can only resume EN_PAUSA tickets' 
      });
    }

    // Calculate pause duration
    const pausaActual = ticket.metadatos?.pausa_actual;
    if (!pausaActual || !pausaActual.fecha_pausa) {
      return res.status(400).json({ 
        error: 'No pause metadata found' 
      });
    }

    const pauseStart = new Date(pausaActual.fecha_pausa);
    const pauseEnd = new Date();
    const pauseDuration = Math.floor((pauseEnd - pauseStart) / (1000 * 60 * 60)); // Hours

    // Update pause time and resume
    const newTiempoPausaTotal = (ticket.tiempo_pausa_total || 0) + pauseDuration;

    // Create resume metadata
    const resumeMetadata = {
      ...pausaActual,
      fecha_reanudacion: pauseEnd.toISOString(),
      duracion_horas: pauseDuration,
      reanudado_por: reanudado_por
    };

    // Clear current pause and add to history
    const metadatos = ticket.metadatos || {};
    metadatos.pausas_historicas = metadatos.pausas_historicas || [];
    metadatos.pausas_historicas.push(resumeMetadata);
    delete metadatos.pausa_actual;

    const result = await pool.query(
      `UPDATE tickets
       SET estado = 'ACTIVO',
           tiempo_pausa_total = $1,
           metadatos = $2,
           fecha_actualizado = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newTiempoPausaTotal, JSON.stringify(metadatos), req.params.id]
    );

    res.json({
      ticket: result.rows[0],
      message: 'Ticket resumed successfully',
      pause_duration_hours: pauseDuration,
      total_pause_time_hours: newTiempoPausaTotal,
      deadline_extended: true
    });
  } catch (error) {
    console.error('Error resuming ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;