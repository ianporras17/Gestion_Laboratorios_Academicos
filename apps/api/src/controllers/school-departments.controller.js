const db = require('../db/pool');
const { validationResult } = require('express-validator');

/**
 * Obtener todos los departamentos escolares
 */
const getAllDepartments = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    
    let query = `
      SELECT 
        id,
        name,
        email_domain,
        description,
        is_active,
        created_at,
        updated_at
      FROM school_departments
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      params.push(is_active === 'true');
    }
    
    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR email_domain ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error getting school departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener un departamento por ID
 */
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id,
        name,
        email_domain,
        description,
        is_active,
        created_at,
        updated_at
      FROM school_departments
      WHERE id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting department by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Crear un nuevo departamento
 */
const createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }
    
    const { name, email_domain, description } = req.body;
    
    const query = `
      INSERT INTO school_departments (name, email_domain, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await db.query(query, [name, email_domain, description]);
    
    res.status(201).json({
      success: true,
      message: 'Departamento creado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe un departamento con ese nombre o dominio de email'
      });
    }
    
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar un departamento
 */
const updateDepartment = async (req, res) => {
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
    const { name, email_domain, description, is_active } = req.body;
    
    const query = `
      UPDATE school_departments SET
        name = COALESCE($1, name),
        email_domain = COALESCE($2, email_domain),
        description = COALESCE($3, description),
        is_active = COALESCE($4, is_active),
        updated_at = now()
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [name, email_domain, description, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Departamento actualizado exitosamente',
      data: result.rows[0]
    });
    
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe un departamento con ese nombre o dominio de email'
      });
    }
    
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Eliminar un departamento (soft delete)
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el departamento tiene laboratorios asociados
    const labsQuery = 'SELECT COUNT(*) as count FROM labs WHERE school_dept_id = $1';
    const labsResult = await db.query(labsQuery, [id]);
    
    if (parseInt(labsResult.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el departamento porque tiene laboratorios asociados'
      });
    }
    
    // Soft delete - marcar como inactivo
    const query = `
      UPDATE school_departments 
      SET is_active = false, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Departamento no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Departamento eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
