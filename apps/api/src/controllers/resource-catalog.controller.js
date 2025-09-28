const db = require('../db/pool');
const { validationResult } = require('express-validator');

// =========================
// MÓDULO 1.2: CATÁLOGO DE RECURSOS
// =========================

/**
 * Obtener catálogo de recursos con filtros
 */
const getResourceCatalog = async (req, res) => {
  try {
    const { 
      lab_id, 
      type, 
      state, 
      is_public, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        r.*,
        l.name as lab_name,
        l.location as lab_location,
        rs.technical_sheet,
        rs.specifications,
        cs.qty_available,
        cs.unit,
        cs.reorder_point,
        rp.url as primary_photo_url,
        rp.caption as photo_caption
      FROM resources r
      LEFT JOIN labs l ON r.lab_id = l.id
      LEFT JOIN resource_specs rs ON r.id = rs.resource_id
      LEFT JOIN consumable_stock cs ON r.id = cs.resource_id
      LEFT JOIN resource_photos rp ON r.id = rp.resource_id AND rp.is_primary = true
      WHERE 1=1
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (lab_id) {
      conditions.push(`r.lab_id = $${paramCount++}`);
      params.push(lab_id);
    }
    
    if (type) {
      conditions.push(`r.type = $${paramCount++}`);
      params.push(type);
    }
    
    if (state) {
      conditions.push(`r.state = $${paramCount++}`);
      params.push(state);
    }
    
    if (is_public !== undefined) {
      conditions.push(`r.is_public = $${paramCount++}`);
      params.push(is_public === 'true');
    }
    
    if (search) {
      conditions.push(`(
        r.name ILIKE $${paramCount} OR 
        r.description ILIKE $${paramCount} OR 
        r.inventory_code ILIKE $${paramCount} OR
        l.name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY r.name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Contar total de recursos
    let countQuery = `
      SELECT COUNT(*) as total
      FROM resources r
      LEFT JOIN labs l ON r.lab_id = l.id
      WHERE 1=1
    `;
    
    const countConditions = [];
    const countParams = [];
    let countParamCount = 1;
    
    if (lab_id) {
      countConditions.push(`r.lab_id = $${countParamCount++}`);
      countParams.push(lab_id);
    }
    
    if (type) {
      countConditions.push(`r.type = $${countParamCount++}`);
      countParams.push(type);
    }
    
    if (state) {
      countConditions.push(`r.state = $${countParamCount++}`);
      countParams.push(state);
    }
    
    if (is_public !== undefined) {
      countConditions.push(`r.is_public = $${countParamCount++}`);
      countParams.push(is_public === 'true');
    }
    
    if (search) {
      countConditions.push(`(
        r.name ILIKE $${countParamCount} OR 
        r.description ILIKE $${countParamCount} OR 
        r.inventory_code ILIKE $${countParamCount} OR
        l.name ILIKE $${countParamCount}
      )`);
      countParams.push(`%${search}%`);
      countParamCount++;
    }
    
    if (countConditions.length > 0) {
      countQuery += ' AND ' + countConditions.join(' AND ');
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
    console.error('Error getting resource catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener detalles de un recurso específico
 */
const getResourceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información básica del recurso
    const resourceQuery = `
      SELECT 
        r.*,
        l.name as lab_name,
        l.location as lab_location,
        l.email_contact as lab_contact
      FROM resources r
      LEFT JOIN labs l ON r.lab_id = l.id
      WHERE r.id = $1
    `;
    
    const resourceResult = await db.query(resourceQuery, [id]);
    
    if (resourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }
    
    const resource = resourceResult.rows[0];
    
    // Obtener especificaciones técnicas
    const specsQuery = `
      SELECT * FROM resource_specs WHERE resource_id = $1
    `;
    const specsResult = await db.query(specsQuery, [id]);
    
    // Obtener fotos
    const photosQuery = `
      SELECT * FROM resource_photos 
      WHERE resource_id = $1 
      ORDER BY is_primary DESC, created_at ASC
    `;
    const photosResult = await db.query(photosQuery, [id]);
    
    // Obtener stock si es consumible
    const stockQuery = `
      SELECT * FROM consumable_stock WHERE resource_id = $1
    `;
    const stockResult = await db.query(stockQuery, [id]);
    
    // Obtener historial de estados
    const statesQuery = `
      SELECT 
        as.*,
        u.full_name as changed_by_name
      FROM availability_states as
      LEFT JOIN users u ON as.changed_by = u.id
      WHERE as.resource_id = $1
      ORDER BY as.changed_at DESC
      LIMIT 10
    `;
    const statesResult = await db.query(statesQuery, [id]);
    
    // Obtener slots de calendario próximos
    const calendarQuery = `
      SELECT 
        cs.*,
        l.name as lab_name
      FROM calendar_slots cs
      LEFT JOIN labs l ON cs.lab_id = l.id
      WHERE cs.resource_id = $1 
        AND cs.starts_at >= NOW()
      ORDER BY cs.starts_at ASC
      LIMIT 5
    `;
    const calendarResult = await db.query(calendarQuery, [id]);
    
    res.json({
      success: true,
      data: {
        ...resource,
        specifications: specsResult.rows[0] || null,
        photos: photosResult.rows,
        stock: stockResult.rows[0] || null,
        state_history: statesResult.rows,
        upcoming_slots: calendarResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error getting resource details:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar estado de disponibilidad de un recurso
 */
const updateResourceState = async (req, res) => {
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
    const { new_state, reason, expires_at } = req.body;
    
    // Obtener estado actual
    const currentQuery = 'SELECT state FROM resources WHERE id = $1';
    const currentResult = await db.query(currentQuery, [id]);
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      });
    }
    
    const currentState = currentResult.rows[0].state;
    
    // Actualizar estado del recurso
    const updateQuery = `
      UPDATE resources 
      SET state = $1, updated_at = now()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(updateQuery, [new_state, id]);
    
    // Registrar cambio de estado
    const stateQuery = `
      INSERT INTO availability_states (
        resource_id, current_state, previous_state, changed_by, reason, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    await db.query(stateQuery, [
      id, new_state, currentState, req.user.id, reason, expires_at
    ]);
    
    // Registrar en changelog
    const changelogQuery = `
      INSERT INTO publish_changelog (
        actor_user_id, resource_id, field_name, old_value, new_value
      ) VALUES ($1, $2, 'resource_state_changed', $3, $4)
    `;
    
    await db.query(changelogQuery, [
      req.user.id, id, currentState, new_state
    ]);
    
    res.json({
      success: true,
      message: 'Estado del recurso actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating resource state:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Gestionar fotos de recursos
 */
const manageResourcePhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, photo } = req.body;
    
    if (action === 'add') {
      const insertQuery = `
        INSERT INTO resource_photos (resource_id, url, caption, is_primary)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await db.query(insertQuery, [
        id, photo.url, photo.caption, photo.is_primary || false
      ]);
      
      // Si es la foto principal, quitar el flag de otras fotos
      if (photo.is_primary) {
        await db.query(
          'UPDATE resource_photos SET is_primary = false WHERE resource_id = $1 AND id != $2',
          [id, result.rows[0].id]
        );
      }
      
      res.status(201).json({
        success: true,
        message: 'Foto agregada exitosamente',
        data: result.rows[0]
      });
      
    } else if (action === 'update') {
      const updateQuery = `
        UPDATE resource_photos SET
          url = COALESCE($1, url),
          caption = COALESCE($2, caption),
          is_primary = COALESCE($3, is_primary)
        WHERE id = $4 AND resource_id = $5
        RETURNING *
      `;
      
      const result = await db.query(updateQuery, [
        photo.url, photo.caption, photo.is_primary, photo.id, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Foto no encontrada'
        });
      }
      
      // Si es la foto principal, quitar el flag de otras fotos
      if (photo.is_primary) {
        await db.query(
          'UPDATE resource_photos SET is_primary = false WHERE resource_id = $1 AND id != $2',
          [id, photo.id]
        );
      }
      
      res.json({
        success: true,
        message: 'Foto actualizada exitosamente',
        data: result.rows[0]
      });
      
    } else if (action === 'delete') {
      const deleteQuery = `
        DELETE FROM resource_photos 
        WHERE id = $1 AND resource_id = $2
        RETURNING *
      `;
      
      const result = await db.query(deleteQuery, [photo.id, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Foto no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Foto eliminada exitosamente'
      });
    }
    
  } catch (error) {
    console.error('Error managing resource photos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getResourceCatalog,
  getResourceDetails,
  updateResourceState,
  manageResourcePhotos
};
