const { Router } = require('express');
const auth = require('../middlewares/auth'); // import como objeto

const reservations = require('../controllers/admin.reservations.controller');
const loans = require('../controllers/admin.loans.controller');

const router = Router();

// Normaliza middlewares del auth (y crea fallback si falta requireRole)
const authRequired = typeof auth.authRequired === 'function'
  ? auth.authRequired
  : (req, res, next) => res.status(500).json({ error: 'authRequired not available' });

const requireRole = typeof auth.requireRole === 'function'
  ? auth.requireRole
  : (...allowed) => (req, res, next) => {
      if (!req.user?.role) return res.status(401).json({ error: 'Unauthenticated' });
      if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden: insufficient role' });
      next();
    };

// Cambiar estado de RESERVA
router.patch(
  '/reservations/:id/status',
  authRequired,
  requireRole('teacher'), // o 'admin' según tus roles
  ...(reservations.updateReservationValidators || []),
  reservations.adminUpdateReservationStatus
);

// Cambiar estado de PRÉSTAMO
router.patch(
  '/loans/:id/status',
  authRequired,
  requireRole('teacher'),
  ...(loans.updateLoanValidators || []),
  loans.adminUpdateLoanStatus
);

module.exports = router;
