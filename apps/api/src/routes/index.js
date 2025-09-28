const { Router } = require('express');
const router = Router();

// Este /health se verá como /api/health por el prefijo del server
router.get('/health', (_req, res) => res.json({ ok: true }));

// ⚠️ monta subrutas
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/school-departments', require('./school-departments'));
router.use('/labs', require('./labs'));
router.use('/resources', require('./resources'));
router.use('/resource-catalog', require('./resource-catalog'));
router.use('/reservations', require('./reservations'));
router.use('/calendar', require('./calendar'));
router.use('/calendar-availability', require('./calendar-availability'));
router.use('/admin', require('./admin'));
router.use('/notifications', require('./notifications'));
router.use('/history', require('./history'));
router.use('/loans', require('./loans'));  
router.use('/messages', require('./messages'));

module.exports = router;
