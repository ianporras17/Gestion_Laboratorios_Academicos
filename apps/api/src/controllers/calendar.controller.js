const db = require('../db/pool');
const { validationResult } = require('express-validator');

// =========================
// MÓDULO 1.2: PUBLICACIÓN DE DISPONIBILIDAD Y RECURSOS
// =========================

/**
 * Obtener slots del calendario para un laboratorio o recurso
 */
const getCalendarSlots = async (req, res) => {
  try {
    const { lab_id, resource_id, start_date, end_date, status } = req.query;
    
    let query = `
      SELECT 
        cs.*,
        l.name as lab_name,
        r.name as resource_name,
        r.type as resource_type,
        u.full_name as created_by_name
      FROM calendar_slots cs
      LEFT JOIN labs l ON cs.lab_id = l.id
      LEFT JOIN resources r ON cs.resource_id = r.id
      LEFT JOIN users u ON cs.created_by = u.id
      WHERE 1=1
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      conditions.push(`cs.lab_id = $${paramCount++}`);
      params.push(lab_id);
    }
    
    if (resource_id) {
      conditions.push(`cs.resource_id = $${paramCount++}`);
      params.push(resource_id);
    }
    
    if (start_date) {
      conditions.push(`cs.starts_at >= $${paramCount++}`);
      params.push(start_date);
    }
    
    if (end_date) {
      conditions.push(`cs.ends_at <= $${paramCount++}`);
      params.push(end_date);
    }
    
    if (status) {
      conditions.push(`cs.status = $${paramCount++}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY cs.starts_at ASC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting calendar slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo slot del calendario
 */
const createCalendarSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }
    
    const {
      lab_id,
      resource_id,
      starts_at,
      ends_at,
      status = 'DISPONIBLE',
      reason
    } = req.body;
    
    // Verificar que no haya conflictos de horario
    const conflictQuery = `
      SELECT id FROM calendar_slots 
      WHERE lab_id = $1 
        AND (resource_id = $2 OR resource_id IS NULL)
        AND (
          (starts_at < $3 AND ends_at > $3) OR
          (starts_at < $4 AND ends_at > $4) OR
          (starts_at >= $3 AND ends_at <= $4)
        )
    `;
    
    const conflictResult = await db.query(conflictQuery, [
      lab_id, resource_id, starts_at, ends_at
    ]);
    
    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Existe un conflicto de horario con otro slot'
      });
    }
    
    const insertQuery = `
      INSERT INTO calendar_slots (
        lab_id, resource_id, starts_at, ends_at, status, reason, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.query(insertQuery, [
      lab_id, resource_id, starts_at, ends_at, status, reason, req.user.id
    ]);
    
    // Registrar en changelog
    const changelogQuery = `
      INSERT INTO publish_changelog (actor_user_id, lab_id, resource_id, field_name, new_value)
      VALUES ($1, $2, $3, 'calendar_slot_created', $4)
    `;
    
    await db.query(changelogQuery, [
      req.user.id, lab_id, resource_id, `Slot creado: ${starts_at} - ${ends_at}`
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Slot del calendario creado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating calendar slot:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getCalendarSlots,
  createCalendarSlot
};