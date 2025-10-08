const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/procedimientos - Get all procedures
router.get('/', async (req, res) => {
  try {
    const { activo, departamento_id, complejidad, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM procedimientos WHERE 1=1';
    const params = [];

    // Filter by active status
    if (activo !== undefined) {
      params.push(activo === 'true');
      query += ` AND activo = $${params.length}`;
    }

    // Filter by department
    if (departamento_id) {
      params.push(departamento_id);
      query += ` AND departamento_id = $${params.length}`;
    }

    // Filter by complexity
    if (complejidad) {
      params.push(complejidad);
      query += ` AND complejidad = $${params.length}`;
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
    console.error('Error fetching procedimientos:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/procedimientos/:codigo - Get single procedure by codigo
router.get('/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM procedimientos WHERE codigo = $1',
      [req.params.codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimiento not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching procedimiento:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/procedimientos - Create new procedure
router.post('/', async (req, res) => {
  try {
    const {
      id,
      codigo,
      nombre,
      descripcion,
      version = '1.0',
      tiempo_estimado_horas,
      complejidad,
      categoria,
      departamento_id,
      activo = true,
      recursos,
      kpis,
      responsabilidades,
      validaciones
    } = req.body;

    // Validate required fields
    if (!id || !codigo || !nombre) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, codigo, nombre' 
      });
    }

    // Validate complejidad enum
    if (complejidad && !['BAJA', 'MEDIA', 'ALTA'].includes(complejidad)) {
      return res.status(400).json({ 
        error: 'Invalid complejidad. Must be BAJA, MEDIA, or ALTA' 
      });
    }

    const result = await pool.query(
      `INSERT INTO procedimientos (
        id, codigo, nombre, descripcion, version,
        tiempo_estimado_horas, complejidad, categoria,
        departamento_id, activo, recursos, kpis,
        responsabilidades, validaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        id, codigo, nombre, descripcion, version,
        tiempo_estimado_horas, complejidad, categoria,
        departamento_id, activo,
        JSON.stringify(recursos || {}),
        JSON.stringify(kpis || {}),
        JSON.stringify(responsabilidades || {}),
        JSON.stringify(validaciones || {})
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating procedimiento:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Procedimiento with this codigo already exists' 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/procedimientos/:codigo - Update procedure
router.patch('/:codigo', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      version,
      tiempo_estimado_horas,
      complejidad,
      categoria,
      activo,
      recursos,
      kpis,
      responsabilidades,
      validaciones
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
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount}`);
      params.push(descripcion);
      paramCount++;
    }
    if (version !== undefined) {
      updates.push(`version = $${paramCount}`);
      params.push(version);
      paramCount++;
    }
    if (tiempo_estimado_horas !== undefined) {
      updates.push(`tiempo_estimado_horas = $${paramCount}`);
      params.push(tiempo_estimado_horas);
      paramCount++;
    }
    if (complejidad !== undefined) {
      if (!['BAJA', 'MEDIA', 'ALTA'].includes(complejidad)) {
        return res.status(400).json({ 
          error: 'Invalid complejidad. Must be BAJA, MEDIA, or ALTA' 
        });
      }
      updates.push(`complejidad = $${paramCount}`);
      params.push(complejidad);
      paramCount++;
    }
    if (categoria !== undefined) {
      updates.push(`categoria = $${paramCount}`);
      params.push(categoria);
      paramCount++;
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount}`);
      params.push(activo);
      paramCount++;
    }
    if (recursos !== undefined) {
      updates.push(`recursos = $${paramCount}`);
      params.push(JSON.stringify(recursos));
      paramCount++;
    }
    if (kpis !== undefined) {
      updates.push(`kpis = $${paramCount}`);
      params.push(JSON.stringify(kpis));
      paramCount++;
    }
    if (responsabilidades !== undefined) {
      updates.push(`responsabilidades = $${paramCount}`);
      params.push(JSON.stringify(responsabilidades));
      paramCount++;
    }
    if (validaciones !== undefined) {
      updates.push(`validaciones = $${paramCount}`);
      params.push(JSON.stringify(validaciones));
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Always update timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add codigo as last parameter
    params.push(req.params.codigo);

    const query = `
      UPDATE procedimientos 
      SET ${updates.join(', ')}
      WHERE codigo = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimiento not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating procedimiento:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/procedimientos/:codigo - Soft delete (set activo = false)
router.delete('/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE procedimientos 
       SET activo = false, updated_at = CURRENT_TIMESTAMP
       WHERE codigo = $1
       RETURNING *`,
      [req.params.codigo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Procedimiento not found' });
    }

    res.json({ 
      message: 'Procedimiento deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting procedimiento:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;