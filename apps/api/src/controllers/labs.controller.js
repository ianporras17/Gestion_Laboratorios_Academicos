const db = require('../db/pool');
const { validationResult } = require('express-validator');

// =========================
// MÓDULO 1.1: GESTIÓN DE PERFILES DE LABORATORIO
// =========================

/**
 * Obtener todos los laboratorios con información básica
 */
const getAllLabs = async (req, res) => {
  try {
    const { school_dept_id, is_active, search } = req.query;
    
    let query = `
      SELECT 
        l.id,
        l.name,
        l.internal_code,
        l.location,
        l.description,
        l.email_contact,
        l.capacity_max,
        l.is_active,
        l.created_at,
        l.updated_at,
        sd.name as school_department_name,
        COUNT(DISTINCT lr.id) as responsible_count,
        COUNT(DISTINCT r.id) as resource_count
      FROM labs l
      LEFT JOIN school_departments sd ON l.school_dept_id = sd.id
      LEFT JOIN lab_responsibles lr ON l.id = lr.lab_id
      LEFT JOIN resources r ON l.id = r.lab_id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (school_dept_id) {
      conditions.push(`l.school_dept_id = $${paramCount++}`);
      params.push(school_dept_id);
    }
    
    if (is_active !== undefined) {
      conditions.push(`l.is_active = $${paramCount++}`);
      params.push(is_active === 'true');
    }
    
    if (search) {
      conditions.push(`(l.name ILIKE $${paramCount} OR l.internal_code ILIKE $${paramCount} OR l.location ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY l.id, sd.name
      ORDER BY l.name ASC
    `;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting labs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener un laboratorio por ID con información completa
 */
const getLabById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información básica del laboratorio
    const labQuery = `
      SELECT 
        l.*,
        sd.name as school_department_name
      FROM labs l
      LEFT JOIN school_departments sd ON l.school_dept_id = sd.id
      WHERE l.id = $1
    `;
    
    const labResult = await db.query(labQuery, [id]);
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      });
    }
    
    const lab = labResult.rows[0];
    
    // Obtener responsables
    const responsiblesQuery = `
      SELECT * FROM lab_responsibles 
      WHERE lab_id = $1 
      ORDER BY is_primary DESC, full_name ASC
    `;
    const responsiblesResult = await db.query(responsiblesQuery, [id]);
    
    // Obtener políticas
    const policiesQuery = `
      SELECT * FROM lab_policies 
      WHERE lab_id = $1
    `;
    const policiesResult = await db.query(policiesQuery, [id]);
    
    // Obtener horarios
    const hoursQuery = `
      SELECT * FROM lab_open_hours 
      WHERE lab_id = $1 
      ORDER BY weekday, time_start
    `;
    const hoursResult = await db.query(hoursQuery, [id]);
    
    // Obtener recursos
    const resourcesQuery = `
      SELECT 
        r.id,
        r.type,
        r.name,
        r.description,
        r.allowed_roles,
        r.created_at
      FROM resources r 
      WHERE r.lab_id = $1
      ORDER BY r.type, r.name
    `;
    const resourcesResult = await db.query(resourcesQuery, [id]);
    
    // Obtener historial reciente (últimos 10 registros)
    const historyQuery = `
      SELECT 
        lh.*,
        u.full_name as actor_name
      FROM lab_history lh
      LEFT JOIN users u ON lh.actor_user_id = u.id
      WHERE lh.lab_id = $1
      ORDER BY lh.created_at DESC
      LIMIT 10
    `;
    const historyResult = await db.query(historyQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...lab,
        responsibles: responsiblesResult.rows,
        policies: policiesResult.rows[0] || null,
        open_hours: hoursResult.rows,
        resources: resourcesResult.rows,
        recent_history: historyResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting lab by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo laboratorio
 */
const createLab = async (req, res) => {
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
      name,
      internal_code,
      school_dept_id,
      email_contact,
      location,
      description,
      capacity_max,
      responsibles = [],
      policies = {},
      open_hours = []
    } = req.body;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Crear el laboratorio
      const labQuery = `
        INSERT INTO labs (
          name, internal_code, school_dept_id, email_contact, 
          location, description, capacity_max
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const labResult = await client.query(labQuery, [
        name, internal_code, school_dept_id, email_contact,
        location, description, capacity_max
      ]);
      
      const labId = labResult.rows[0].id;
      
      // Crear responsables si se proporcionan
      if (responsibles.length > 0) {
        for (const responsible of responsibles) {
          const responsibleQuery = `
            INSERT INTO lab_responsibles (
              lab_id, full_name, position_title, phone, email, is_primary
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          await client.query(responsibleQuery, [
            labId,
            responsible.full_name,
            responsible.position_title,
            responsible.phone,
            responsible.email,
            responsible.is_primary || false
          ]);
        }
      }
      
      // Crear políticas si se proporcionan
      if (policies.academic_req || policies.safety_req || policies.notes) {
        const policiesQuery = `
          INSERT INTO lab_policies (lab_id, academic_req, safety_req, notes)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(policiesQuery, [
          labId,
          policies.academic_req,
          policies.safety_req,
          policies.notes
        ]);
      }
      
      // Crear horarios si se proporcionan
      if (open_hours.length > 0) {
        for (const hour of open_hours) {
          const hoursQuery = `
            INSERT INTO lab_open_hours (lab_id, weekday, time_start, time_end)
            VALUES ($1, $2, $3, $4)
          `;
          
          await client.query(hoursQuery, [
            labId,
            hour.weekday,
            hour.time_start,
            hour.time_end
          ]);
        }
      }
      
      // Registrar en historial
      const historyQuery = `
        INSERT INTO lab_history (lab_id, actor_user_id, action_type, detail)
        VALUES ($1, $2, 'lab_created', 'Laboratorio creado')
      `;
      
      await client.query(historyQuery, [labId, req.user.id]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Laboratorio creado exitosamente',
        data: labResult.rows[0]
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating lab:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar un laboratorio
 */
const updateLab = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }
    
    const { id } = req.params;
    const {
      name,
      internal_code,
      school_dept_id,
      email_contact,
      location,
      description,
      capacity_max,
      is_active
    } = req.body;
    
    const updateQuery = `
      UPDATE labs SET
        name = COALESCE($1, name),
        internal_code = COALESCE($2, internal_code),
        school_dept_id = COALESCE($3, school_dept_id),
        email_contact = COALESCE($4, email_contact),
        location = COALESCE($5, location),
        description = COALESCE($6, description),
        capacity_max = COALESCE($7, capacity_max),
        is_active = COALESCE($8, is_active),
        updated_at = now()
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [
      name, internal_code, school_dept_id, email_contact,
      location, description, capacity_max, is_active, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorio no encontrado'
      });
    }
    
    // Registrar en historial
    const historyQuery = `
      INSERT INTO lab_history (lab_id, actor_user_id, action_type, detail)
      VALUES ($1, $2, 'lab_updated', 'Información del laboratorio actualizada')
    `;
    
    await db.query(historyQuery, [id, req.user.id]);
    
    res.json({
      success: true,
      message: 'Laboratorio actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating lab:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Gestionar responsables del laboratorio
 */
const manageResponsibles = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, responsible } = req.body;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      if (action === 'add') {
        const insertQuery = `
          INSERT INTO lab_responsibles (lab_id, full_name, position_title, phone, email, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const result = await client.query(insertQuery, [
          id,
          responsible.full_name,
          responsible.position_title,
          responsible.phone,
          responsible.email,
          responsible.is_primary || false
        ]);
        
        // Si es el responsable principal, quitar el flag de otros
        if (responsible.is_primary) {
          await client.query(
            'UPDATE lab_responsibles SET is_primary = false WHERE lab_id = $1 AND id != $2',
            [id, result.rows[0].id]
          );
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Responsable agregado exitosamente',
          data: result.rows[0]
        });
        
      } else if (action === 'update') {
        const updateQuery = `
          UPDATE lab_responsibles SET
            full_name = $1,
            position_title = $2,
            phone = $3,
            email = $4,
            is_primary = $5,
            updated_at = now()
          WHERE id = $6 AND lab_id = $7
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [
          responsible.full_name,
          responsible.position_title,
          responsible.phone,
          responsible.email,
          responsible.is_primary,
          responsible.id,
          id
        ]);
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Responsable no encontrado'
          });
        }
        
        // Si es el responsable principal, quitar el flag de otros
        if (responsible.is_primary) {
          await client.query(
            'UPDATE lab_responsibles SET is_primary = false WHERE lab_id = $1 AND id != $2',
            [id, responsible.id]
          );
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Responsable actualizado exitosamente',
          data: result.rows[0]
        });
        
      } else if (action === 'delete') {
        const deleteQuery = `
          DELETE FROM lab_responsibles 
          WHERE id = $1 AND lab_id = $2
          RETURNING *
        `;
        
        const result = await client.query(deleteQuery, [responsible.id, id]);
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Responsable no encontrado'
          });
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Responsable eliminado exitosamente'
        });
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error managing responsibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Gestionar políticas del laboratorio
 */
const managePolicies = async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_req, safety_req, notes } = req.body;
    
    const upsertQuery = `
      INSERT INTO lab_policies (lab_id, academic_req, safety_req, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (lab_id) 
      DO UPDATE SET
        academic_req = EXCLUDED.academic_req,
        safety_req = EXCLUDED.safety_req,
        notes = EXCLUDED.notes,
        updated_at = now()
      RETURNING *
    `;
    
    const result = await db.query(upsertQuery, [id, academic_req, safety_req, notes]);
    
    // Registrar en historial
    const historyQuery = `
      INSERT INTO lab_history (lab_id, actor_user_id, action_type, detail)
      VALUES ($1, $2, 'policies_updated', 'Políticas del laboratorio actualizadas')
    `;
    
    await db.query(historyQuery, [id, req.user.id]);
    
    res.json({
      success: true,
      message: 'Políticas actualizadas exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error managing policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Gestionar horarios del laboratorio
 */
const manageOpenHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, hours } = req.body;
    
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      if (action === 'replace') {
        // Eliminar horarios existentes
        await client.query('DELETE FROM lab_open_hours WHERE lab_id = $1', [id]);
        
        // Insertar nuevos horarios
        if (hours && hours.length > 0) {
          for (const hour of hours) {
            const insertQuery = `
              INSERT INTO lab_open_hours (lab_id, weekday, time_start, time_end)
              VALUES ($1, $2, $3, $4)
            `;
            
            await client.query(insertQuery, [
              id, hour.weekday, hour.time_start, hour.time_end
            ]);
          }
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Horarios actualizados exitosamente'
        });
        
      } else if (action === 'add') {
        const insertQuery = `
          INSERT INTO lab_open_hours (lab_id, weekday, time_start, time_end)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        
        const result = await client.query(insertQuery, [
          id, hours.weekday, hours.time_start, hours.time_end
        ]);
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Horario agregado exitosamente',
          data: result.rows[0]
        });
        
      } else if (action === 'delete') {
        const deleteQuery = `
          DELETE FROM lab_open_hours 
          WHERE id = $1 AND lab_id = $2
          RETURNING *
        `;
        
        const result = await client.query(deleteQuery, [hours.id, id]);
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Horario no encontrado'
          });
        }
        
        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: 'Horario eliminado exitosamente'
        });
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error managing open hours:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener historial del laboratorio
 */
const getLabHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, action_type } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        lh.*,
        u.full_name as actor_name
      FROM lab_history lh
      LEFT JOIN users u ON lh.actor_user_id = u.id
      WHERE lh.lab_id = $1
    `;
    
    const params = [id];
    let paramCount = 2;
    
    if (action_type) {
      query += ` AND lh.action_type = $${paramCount++}`;
      params.push(action_type);
    }
    
    query += ` ORDER BY lh.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Contar total de registros
    let countQuery = `
      SELECT COUNT(*) as total
      FROM lab_history lh
      WHERE lh.lab_id = $1
    `;
    
    const countParams = [id];
    let countParamCount = 2;
    
    if (action_type) {
      countQuery += ` AND lh.action_type = $${countParamCount++}`;
      countParams.push(action_type);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error getting lab history:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getAllLabs,
  getLabById,
  createLab,
  updateLab,
  manageResponsibles,
  managePolicies,
  manageOpenHours,
  getLabHistory
};
