const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// =========================
// 1. LABORATORIOS
// =========================

// GET /labs - Listar laboratorios con filtros
router.get('/', async (req, res) => {
  try {
    const { query, school_dept_id } = req.query;
    let sql = `
      SELECT 
        l.id,
        l.name,
        l.internal_code,
        l.school_dept_id,
        sd.name as school_name,
        l.email_contact,
        l.location,
        l.description,
        l.capacity_max,
        l.created_at,
        l.updated_at
      FROM lab l
      LEFT JOIN school_department sd ON l.school_dept_id = sd.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (query) {
      sql += ` AND (l.name ILIKE $${paramCount} OR l.internal_code ILIKE $${paramCount} OR sd.name ILIKE $${paramCount})`;
      params.push(`%${query}%`);
      paramCount++;
    }
    
    if (school_dept_id) {
      sql += ` AND l.school_dept_id = $${paramCount}`;
      params.push(school_dept_id);
    }
    
    sql += ` ORDER BY l.name`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /labs/:id - Obtener laboratorio por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        l.*,
        sd.name as school_name
      FROM lab l
      LEFT JOIN school_department sd ON l.school_dept_id = sd.id
      WHERE l.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /labs - Crear laboratorio
router.post('/', async (req, res) => {
  try {
    const {
      name,
      internal_code,
      school_dept_id,
      email_contact,
      location,
      description,
      capacity_max
    } = req.body;
    
    // Validaciones
    if (!name || !internal_code || !school_dept_id || !email_contact || !location) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Validar email institucional
    if (!email_contact.includes('@tec.ac.cr') && !email_contact.includes('@itcr.ac.cr')) {
      return res.status(400).json({ error: 'El correo debe ser institucional' });
    }
    
    const result = await pool.query(`
      INSERT INTO lab (name, internal_code, school_dept_id, email_contact, location, description, capacity_max)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, internal_code, school_dept_id, email_contact, location, description, capacity_max]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'El código interno ya existe' });
    } else {
      console.error('Error creating lab:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// PUT /labs/:id - Actualizar laboratorio
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      internal_code,
      school_dept_id,
      email_contact,
      location,
      description,
      capacity_max
    } = req.body;
    
    // Validaciones
    if (!name || !internal_code || !school_dept_id || !email_contact || !location) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Validar email institucional
    if (!email_contact.includes('@tec.ac.cr') && !email_contact.includes('@itcr.ac.cr')) {
      return res.status(400).json({ error: 'El correo debe ser institucional' });
    }
    
    const result = await pool.query(`
      UPDATE lab 
      SET name = $1, internal_code = $2, school_dept_id = $3, email_contact = $4, 
          location = $5, description = $6, capacity_max = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, internal_code, school_dept_id, email_contact, location, description, capacity_max, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'El código interno ya existe' });
    } else {
      console.error('Error updating lab:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// DELETE /labs/:id - Eliminar laboratorio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM lab WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratorio no encontrado' });
    }
    
    res.json({ message: 'Laboratorio eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting lab:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 2. RESPONSABLES Y CONTACTOS
// =========================

// GET /labs/:id/responsibles - Listar responsables del laboratorio
router.get('/:id/responsibles', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM lab_responsible 
      WHERE lab_id = $1 
      ORDER BY is_primary DESC, full_name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab responsibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /labs/:id/responsibles - Crear responsable
router.post('/:id/responsibles', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, position_title, phone, email, is_primary } = req.body;
    
    if (!full_name || !position_title || !email) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Validar email institucional
    if (!email.includes('@tec.ac.cr') && !email.includes('@itcr.ac.cr')) {
      return res.status(400).json({ error: 'El correo debe ser institucional' });
    }
    
    const result = await pool.query(`
      INSERT INTO lab_responsible (lab_id, full_name, position_title, phone, email, is_primary)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, full_name, position_title, phone, email, is_primary || false]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lab responsible:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /labs/:id/responsibles/:responsibleId - Actualizar responsable
router.put('/:id/responsibles/:responsibleId', async (req, res) => {
  try {
    const { id, responsibleId } = req.params;
    const { full_name, position_title, phone, email, is_primary } = req.body;
    
    if (!full_name || !position_title || !email) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Validar email institucional
    if (!email.includes('@tec.ac.cr') && !email.includes('@itcr.ac.cr')) {
      return res.status(400).json({ error: 'El correo debe ser institucional' });
    }
    
    const result = await pool.query(`
      UPDATE lab_responsible 
      SET full_name = $1, position_title = $2, phone = $3, email = $4, is_primary = $5
      WHERE id = $6 AND lab_id = $7
      RETURNING *
    `, [full_name, position_title, phone, email, is_primary || false, responsibleId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Responsable no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab responsible:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /labs/:id/responsibles/:responsibleId - Eliminar responsable
router.delete('/:id/responsibles/:responsibleId', async (req, res) => {
  try {
    const { id, responsibleId } = req.params;
    const result = await pool.query(`
      DELETE FROM lab_responsible 
      WHERE id = $1 AND lab_id = $2
      RETURNING *
    `, [responsibleId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Responsable no encontrado' });
    }
    
    res.json({ message: 'Responsable eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting lab responsible:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 3. RECURSOS (EQUIPOS Y CONSUMIBLES)
// =========================

// GET /labs/:id/resources - Listar recursos del laboratorio
router.get('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    
    let sql = `
      SELECT 
        r.*,
        cs.unit,
        cs.qty_available,
        cs.reorder_point
      FROM resource r
      LEFT JOIN consumable_stock cs ON r.id = cs.resource_id
      WHERE r.lab_id = $1
    `;
    
    const params = [id];
    
    if (type) {
      sql += ` AND r.type = $2`;
      params.push(type);
    }
    
    sql += ` ORDER BY r.type, r.name`;
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab resources:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /labs/:id/resources - Crear recurso
router.post('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      name,
      inventory_code,
      state,
      location,
      last_maintenance,
      tech_sheet,
      description,
      unit,
      qty_available,
      reorder_point
    } = req.body;
    
    if (!type || !name || !state) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    // Validar tipo
    if (!['EQUIPMENT', 'CONSUMABLE', 'SOFTWARE'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de recurso inválido' });
    }
    
    // Validar estado
    if (!['DISPONIBLE', 'RESERVADO', 'EN_MANTENIMIENTO', 'INACTIVO'].includes(state)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Crear recurso
      const resourceResult = await client.query(`
        INSERT INTO resource (lab_id, type, name, inventory_code, state, location, last_maintenance, tech_sheet, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [id, type, name, inventory_code, state, location, last_maintenance, tech_sheet, description]);
      
      const resource = resourceResult.rows[0];
      
      // Si es consumible, crear stock
      if (type === 'CONSUMABLE' && unit && qty_available !== undefined && reorder_point !== undefined) {
        await client.query(`
          INSERT INTO consumable_stock (resource_id, unit, qty_available, reorder_point)
          VALUES ($1, $2, $3, $4)
        `, [resource.id, unit, qty_available, reorder_point]);
      }
      
      await client.query('COMMIT');
      res.status(201).json(resource);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'El código de inventario ya existe' });
    } else {
      console.error('Error creating resource:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// =========================
// 4. POLÍTICAS INTERNAS
// =========================

// GET /labs/:id/policies - Obtener políticas del laboratorio
router.get('/:id/policies', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM lab_policy WHERE lab_id = $1
    `, [id]);
    
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching lab policies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /labs/:id/policies - Actualizar políticas del laboratorio
router.put('/:id/policies', async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_req, safety_req, notes } = req.body;
    
    const result = await pool.query(`
      INSERT INTO lab_policy (lab_id, academic_req, safety_req, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (lab_id) 
      DO UPDATE SET 
        academic_req = EXCLUDED.academic_req,
        safety_req = EXCLUDED.safety_req,
        notes = EXCLUDED.notes
      RETURNING *
    `, [id, academic_req, safety_req, notes]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab policies:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 5. HORARIOS DE FUNCIONAMIENTO
// =========================

// GET /labs/:id/schedule - Obtener horarios del laboratorio
router.get('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM lab_open_hours 
      WHERE lab_id = $1 
      ORDER BY weekday, time_start
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /labs/:id/schedule - Crear horario
router.post('/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { weekday, time_start, time_end } = req.body;
    
    if (weekday === undefined || !time_start || !time_end) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    if (weekday < 0 || weekday > 6) {
      return res.status(400).json({ error: 'Día de la semana inválido' });
    }
    
    const result = await pool.query(`
      INSERT INTO lab_open_hours (lab_id, weekday, time_start, time_end)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, weekday, time_start, time_end]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Ya existe un horario para ese día y hora' });
    } else {
      console.error('Error creating lab schedule:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// DELETE /labs/:id/schedule/:scheduleId - Eliminar horario
router.delete('/:id/schedule/:scheduleId', async (req, res) => {
  try {
    const { id, scheduleId } = req.params;
    const result = await pool.query(`
      DELETE FROM lab_open_hours 
      WHERE id = $1 AND lab_id = $2
      RETURNING *
    `, [scheduleId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    
    res.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting lab schedule:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 6. HISTORIAL DEL LABORATORIO
// =========================

// GET /labs/:id/history - Obtener historial del laboratorio
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;
    
    const result = await pool.query(`
      SELECT 
        lh.*,
        u.full_name as actor_name
      FROM lab_history lh
      LEFT JOIN app_user u ON lh.actor_user_id = u.id
      WHERE lh.lab_id = $1
      ORDER BY lh.created_at DESC
      LIMIT $2
    `, [id, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab history:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =========================
// 7. ESCUELAS/DEPARTAMENTOS
// =========================

// GET /schools - Listar escuelas/departamentos
router.get('/schools', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM school_department 
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
