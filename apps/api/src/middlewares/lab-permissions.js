const db = require('../db/pool');

/**
 * Middleware para verificar si el usuario tiene permisos sobre un laboratorio específico
 * @param {string} permission - Tipo de permiso: 'read', 'write', 'admin'
 */
const checkLabPermission = (permission = 'read') => {
  return async (req, res, next) => {
    try {
      const { id: labId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Los administradores tienen todos los permisos
      if (userRole === 'admin') {
        return next();
      }

      // Verificar si el laboratorio existe
      const labQuery = 'SELECT id, is_active FROM labs WHERE id = $1';
      const labResult = await db.query(labQuery, [labId]);
      
      if (labResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Laboratorio no encontrado'
        });
      }

      const lab = labResult.rows[0];

      // Si el laboratorio está inactivo, solo los administradores pueden acceder
      if (!lab.is_active && userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este laboratorio inactivo'
        });
      }

      // Verificar permisos según el rol
      switch (userRole) {
        case 'tech_manager':
          // Los encargados técnicos tienen permisos de escritura en todos los laboratorios
          if (permission === 'read' || permission === 'write') {
            return next();
          }
          break;

        case 'lab_owner':
          // Los dueños de laboratorio tienen permisos en sus laboratorios asignados
          const ownerQuery = `
            SELECT 1 FROM lab_staff 
            WHERE lab_id = $1 AND user_id = $2 AND role = 'owner'
          `;
          const ownerResult = await db.query(ownerQuery, [labId, userId]);
          
          if (ownerResult.rows.length > 0) {
            return next();
          }
          break;

        case 'teacher':
        case 'student':
          // Docentes y estudiantes solo tienen permisos de lectura
          if (permission === 'read') {
            return next();
          }
          break;

        default:
          return res.status(403).json({
            success: false,
            message: 'Rol de usuario no válido'
          });
      }

      // Si llegamos aquí, el usuario no tiene permisos
      return res.status(403).json({
        success: false,
        message: `No tienes permisos de ${permission} para este laboratorio`
      });

    } catch (error) {
      console.error('Error checking lab permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario es responsable de un laboratorio
 */
const checkLabResponsible = async (req, res, next) => {
  try {
    const { id: labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Los administradores y encargados técnicos siempre tienen acceso
    if (userRole === 'admin' || userRole === 'tech_manager') {
      return next();
    }

    // Verificar si es dueño del laboratorio
    const ownerQuery = `
      SELECT 1 FROM lab_staff 
      WHERE lab_id = $1 AND user_id = $2 AND role = 'owner'
    `;
    const ownerResult = await db.query(ownerQuery, [labId, userId]);
    
    if (ownerResult.rows.length > 0) {
      return next();
    }

    // Verificar si es responsable técnico del laboratorio
    const techQuery = `
      SELECT 1 FROM lab_staff 
      WHERE lab_id = $1 AND user_id = $2 AND role = 'tech'
    `;
    const techResult = await db.query(techQuery, [labId, userId]);
    
    if (techResult.rows.length > 0) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No eres responsable de este laboratorio'
    });

  } catch (error) {
    console.error('Error checking lab responsible:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar si el usuario puede gestionar recursos de un laboratorio
 */
const checkResourceManagement = async (req, res, next) => {
  try {
    const { id: labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Los administradores y encargados técnicos siempre tienen acceso
    if (userRole === 'admin' || userRole === 'tech_manager') {
      return next();
    }

    // Verificar si es dueño del laboratorio
    const ownerQuery = `
      SELECT 1 FROM lab_staff 
      WHERE lab_id = $1 AND user_id = $2 AND role = 'owner'
    `;
    const ownerResult = await db.query(ownerQuery, [labId, userId]);
    
    if (ownerResult.rows.length > 0) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para gestionar recursos de este laboratorio'
    });

  } catch (error) {
    console.error('Error checking resource management:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar si el usuario puede ver el historial de un laboratorio
 */
const checkHistoryAccess = async (req, res, next) => {
  try {
    const { id: labId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Los administradores, encargados técnicos y dueños pueden ver todo el historial
    if (userRole === 'admin' || userRole === 'tech_manager') {
      return next();
    }

    // Verificar si es dueño del laboratorio
    const ownerQuery = `
      SELECT 1 FROM lab_staff 
      WHERE lab_id = $1 AND user_id = $2 AND role = 'owner'
    `;
    const ownerResult = await db.query(ownerQuery, [labId, userId]);
    
    if (ownerResult.rows.length > 0) {
      return next();
    }

    // Los docentes y estudiantes pueden ver el historial público
    if (userRole === 'teacher' || userRole === 'student') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver el historial de este laboratorio'
    });

  } catch (error) {
    console.error('Error checking history access:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  checkLabPermission,
  checkLabResponsible,
  checkResourceManagement,
  checkHistoryAccess
};
