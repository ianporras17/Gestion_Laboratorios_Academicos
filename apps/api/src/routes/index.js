const { Router } = require('express');
const router = Router();

// Este /health se verá como /api/health por el prefijo del server
router.get('/health', (_req, res) => res.json({ ok: true }));

// ⚠️ monta subrutas
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/resources', require('./resources'));
router.use('/reservations', require('./reservations'));
router.use('/calendar', require('./calendar'));
router.use('/admin', require('./admin'));
router.use('/notifications', require('./notifications'));
router.use('/history', require('./history'));
router.use('/loans', require('./loans'));  
router.use('/messages', require('./messages'));

module.exports = router;
