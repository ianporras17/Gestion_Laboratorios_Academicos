// apps/api/src/middlewares/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

/** Verifica JWT y coloca el payload en req.user */
function authRequired(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    // payload debe incluir { id, role, email, ... }
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/** Autoriza por rol. Uso: requireRole('teacher') o requireRole('teacher','admin') */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: 'Unauthenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

module.exports = { authRequired, requireRole };
