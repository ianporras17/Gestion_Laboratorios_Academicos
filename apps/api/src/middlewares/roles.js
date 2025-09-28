function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: roles,
        current_role: req.user?.role
      });
    }
    next();
  };
}

// Función para verificar múltiples roles con lógica OR
function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: roles,
        current_role: req.user?.role
      });
    }
    next();
  };
}

// Función para verificar si el usuario tiene al menos uno de los roles especificados
function hasAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        required_roles: roles,
        current_role: req.user?.role
      });
    }
    next();
  };
}

module.exports = { 
  requireRole,
  requireAnyRole,
  hasAnyRole
};
