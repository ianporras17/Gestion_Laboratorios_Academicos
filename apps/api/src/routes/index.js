const express = require('express');

const departments = require('./departments.routes');
const labs = require('./labs.routes');
const resourceTypes = require('./resource_types.routes');
const resources = require('./resources.routes');
const availability = require('./availability.routes'); 
const requests      = require('./requests.routes'); 
const control = require('./control.routes');

const router = express.Router();

// ✅ Respuesta al GET /api (para que el app no vea 404)
router.get('/', (_req, res) => {
  res.json({ ok: true, name: 'LabTEC API', version: 1 });
});

// Dominios principales
router.use('/departments', departments);
router.use('/labs', labs);
router.use('/resource-types', resourceTypes);
router.use('/resources', resources);
router.use('/', availability);
router.use('/requests',      requests); 
router.use('/', control);

module.exports = router;
