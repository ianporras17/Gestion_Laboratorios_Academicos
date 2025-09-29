// apps/api/src/routes/index.js
const express = require('express');

// Dominios principales
const departments   = require('./departments.routes');
const labs          = require('./labs.routes');
const resourceTypes = require('./resource_types.routes');
const resources     = require('./resources.routes');

// Módulos ya existentes
const availability  = require('./availability.routes'); // /labs/:labId/slots, /subscriptions, /changelog
const requests      = require('./requests.routes');     // /requests/...
const control       = require('./control.routes');      // /control/... (si define prefijos internos)
const tech          = require('./tech.routes');         // /tech/...   (si define prefijos internos)

// ✅ Nuevos módulos del 2.2 y 2.3
const inventory     = require('./inventory.routes');    // /inventory/...
const maintenance   = require('./maintenance.routes');  // /maintenance/...
const reports      = require('./reports.routes'); 



const router = express.Router();

// Ping raíz para el app (evita 404 al cargar /api)
router.get('/', (_req, res) => {
  res.json({ ok: true, name: 'LabTEC API', version: 1 });
});

// Montaje por prefijos “limpios”
router.use('/departments',    departments);
router.use('/labs',           labs);
router.use('/resource-types', resourceTypes);
router.use('/resources',      resources);
router.use('/requests',       requests);

// Nuevos prefijos
router.use('/inventory',      inventory);
router.use('/maintenance',    maintenance);

// Routers que exponen paths en raíz (mantener al final para evitar sombras)
router.use('/', availability);
router.use('/', control);
router.use('/', tech);
router.use('/reports',        reports);

// (Opcional) 404 local del sub-árbol /api
// router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;
