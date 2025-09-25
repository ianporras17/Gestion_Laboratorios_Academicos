const { Router } = require('express');
const router = Router();

// Este /health se verá como /api/health por el prefijo del server
router.get('/health', (_req, res) => res.json({ ok: true }));

// ⚠️ monta subrutas
router.use('/auth', require('./auth'));
router.use('/users', require('./users'));

module.exports = router;
