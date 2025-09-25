const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// =========================
// 1. CALENDARIO Y DISPONIBILIDAD
// =========================

// GET /availability/calendar - Obtener slots del calendario
router.get('/calendar', async (req, res) => {
  try {
    const { lab_id, resource_id, start_date, end_date, status } = req.query;
    
    let sql = `
      SELECT 
        cs.*,
        l.name as lab_name,
        r.name as resource_name,
        r.type as resource_type,
        u.full_name as created_by_name
      FROM calendar_slot cs
      LEFT JOIN lab l ON cs.lab_id = l.id
      LEFT JOIN resource r ON cs.resource_id = r.id
      LEFT JOIN app_user u ON cs.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      sql += ` AND cs.lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (resource_id) {
      sql += ` AND cs.resource_id = $${paramCount}`;
      params.push(resource_id);
      paramCount++;
    }
    
    if (start_date) {
      sql += ` AND cs.starts_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND cs.ends_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND cs.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    sql += ` ORDER BY cs.starts_at`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching calendar slots:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /availability/calendar - Crear slot del calendario
router.post('/calendar', async (req, res) => {
  try {
    const {
      lab_id,
      resource_id,
      starts_at,
      ends_at,
      status,
      reason,
      created_by
    } = req.body;
    
    // Validaciones
    if (!lab_id || !starts_at || !ends_at || !status) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    if (new Date(ends_at) <= new Date(starts_at)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' });
    }
    
    // Validar status
    const validStatuses = ['DISPONIBLE', 'BLOQUEADO', 'RESERVADO', 'MANTENIMIENTO', 'EXCLUSIVO'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const result = await pool.query(`
      INSERT INTO calendar_slot (lab_id, resource_id, starts_at, ends_at, status, reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [lab_id, resource_id, starts_at, ends_at, status, reason, created_by]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating calendar slot:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /availability/calendar/:id - Actualizar slot del calendario
router.put('/calendar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      lab_id,
      resource_id,
      starts_at,
      ends_at,
      status,
      reason
    } = req.body;
    
    // Validaciones
    if (!lab_id || !starts_at || !ends_at || !status) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    if (new Date(ends_at) <= new Date(starts_at)) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la de inicio' });
    }
    
    const validStatuses = ['DISPONIBLE', 'BLOQUEADO', 'RESERVADO', 'MANTENIMIENTO', 'EXCLUSIVO'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const result = await pool.query(`
      UPDATE calendar_slot 
      SET lab_id = $1, resource_id = $2, starts_at = $3, ends_at = $4, status = $5, reason = $6
      WHERE id = $7
      RETURNING *
    `, [lab_id, resource_id, starts_at, ends_at, status, reason, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating calendar slot:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /availability/calendar/:id - Eliminar slot del calendario
router.delete('/calendar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM calendar_slot WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot no encontrado' });
    }
    
    res.json({ message: 'Slot eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting calendar slot:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 2. RECURSOS Y CATÁLOGO
// =========================

// GET /availability/resources - Listar recursos disponibles
router.get('/resources', async (req, res) => {
  try {
    const { lab_id, type, state, search } = req.query;
    
    let sql = `
      SELECT 
        r.*,
        l.name as lab_name,
        l.location as lab_location,
        cs.unit,
        cs.qty_available,
        cs.reorder_point,
        array_agg(rp.url) as photos
      FROM resource r
      LEFT JOIN lab l ON r.lab_id = l.id
      LEFT JOIN consumable_stock cs ON r.id = cs.resource_id
      LEFT JOIN resource_photo rp ON r.id = rp.resource_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      sql += ` AND r.lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (type) {
      sql += ` AND r.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (state) {
      sql += ` AND r.state = $${paramCount}`;
      params.push(state);
      paramCount++;
    }
    
    if (search) {
      sql += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    sql += ` GROUP BY r.id, l.name, l.location, cs.unit, cs.qty_available, cs.reorder_point
             ORDER BY r.name`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /availability/resources/:id - Obtener recurso específico
router.get('/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        r.*,
        l.name as lab_name,
        l.location as lab_location,
        cs.unit,
        cs.qty_available,
        cs.reorder_point,
        array_agg(rp.url) as photos
      FROM resource r
      LEFT JOIN lab l ON r.lab_id = l.id
      LEFT JOIN consumable_stock cs ON r.id = cs.resource_id
      LEFT JOIN resource_photo rp ON r.id = rp.resource_id
      WHERE r.id = $1
      GROUP BY r.id, l.name, l.location, cs.unit, cs.qty_available, cs.reorder_point
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /availability/resources/:id/state - Cambiar estado del recurso
router.put('/resources/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { state, reason, user_id } = req.body;
    
    // Validar estado
    const validStates = ['DISPONIBLE', 'RESERVADO', 'EN_MANTENIMIENTO', 'INACTIVO'];
    if (!validStates.includes(state)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Actualizar estado del recurso
      const resourceResult = await client.query(`
        UPDATE resource 
        SET state = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [state, id]);
      
      if (resourceResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }
      
      // Registrar en bitácora de cambios
      await client.query(`
        INSERT INTO publish_changelog (actor_user_id, resource_id, field_name, old_value, new_value)
        VALUES ($1, $2, 'state', $3, $4)
      `, [user_id, id, resourceResult.rows[0].state, state]);
      
      await client.query('COMMIT');
      res.json(resourceResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating resource state:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 3. SUSCRIPCIONES Y NOTIFICACIONES
// =========================

// GET /availability/subscriptions - Listar suscripciones del usuario
router.get('/subscriptions', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }
    
    const result = await pool.query(`
      SELECT 
        s.*,
        l.name as lab_name,
        r.name as resource_name,
        r.type as resource_type
      FROM availability_subscription s
      LEFT JOIN lab l ON s.lab_id = l.id
      LEFT JOIN resource r ON s.resource_id = r.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `, [user_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /availability/subscriptions - Crear suscripción
router.post('/subscriptions', async (req, res) => {
  try {
    const { user_id, lab_id, resource_id } = req.body;
    
    if (!user_id || (!lab_id && !resource_id)) {
      return res.status(400).json({ error: 'user_id y (lab_id o resource_id) son requeridos' });
    }
    
    // Verificar si ya existe la suscripción
    const existing = await pool.query(`
      SELECT id FROM availability_subscription 
      WHERE user_id = $1 AND lab_id = $2 AND resource_id = $3
    `, [user_id, lab_id, resource_id]);
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una suscripción para este recurso' });
    }
    
    const result = await pool.query(`
      INSERT INTO availability_subscription (user_id, lab_id, resource_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [user_id, lab_id, resource_id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /availability/subscriptions/:id - Eliminar suscripción
router.delete('/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM availability_subscription WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }
    
    res.json({ message: 'Suscripción eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 4. BITÁCORA DE CAMBIOS
// =========================

// GET /availability/changelog - Obtener bitácora de cambios
router.get('/changelog', async (req, res) => {
  try {
    const { lab_id, resource_id, limit = 100 } = req.query;
    
    let sql = `
      SELECT 
        pc.*,
        u.full_name as actor_name,
        l.name as lab_name,
        r.name as resource_name
      FROM publish_changelog pc
      LEFT JOIN app_user u ON pc.actor_user_id = u.id
      LEFT JOIN lab l ON pc.lab_id = l.id
      LEFT JOIN resource r ON pc.resource_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      sql += ` AND pc.lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (resource_id) {
      sql += ` AND pc.resource_id = $${paramCount}`;
      params.push(resource_id);
      paramCount++;
    }
    
    sql += ` ORDER BY pc.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching changelog:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 5. NOTIFICACIONES
// =========================

// GET /availability/notifications - Obtener notificaciones del usuario
router.get('/notifications', async (req, res) => {
  try {
    const { user_id, limit = 50 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id es requerido' });
    }
    
    const result = await pool.query(`
      SELECT * FROM notification 
      WHERE user_id = $1 
      ORDER BY sent_at DESC 
      LIMIT $2
    `, [user_id, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /availability/notifications/:id/read - Marcar notificación como leída
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE notification 
      SET read_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 6. ESTADÍSTICAS Y REPORTES
// =========================

// GET /availability/stats - Obtener estadísticas de disponibilidad
router.get('/stats', async (req, res) => {
  try {
    const { lab_id, start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE WHEN status = 'DISPONIBLE' THEN 1 END) as available_slots,
        COUNT(CASE WHEN status = 'RESERVADO' THEN 1 END) as reserved_slots,
        COUNT(CASE WHEN status = 'BLOQUEADO' THEN 1 END) as blocked_slots,
        COUNT(CASE WHEN status = 'MANTENIMIENTO' THEN 1 END) as maintenance_slots,
        COUNT(CASE WHEN status = 'EXCLUSIVO' THEN 1 END) as exclusive_slots
      FROM calendar_slot
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      sql += ` AND lab_id = $${paramCount}`;
      params.push(lab_id);
      paramCount++;
    }
    
    if (start_date) {
      sql += ` AND starts_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND ends_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
