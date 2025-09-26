const { Router } = require('express');
const { requireRole } = require('../middlewares/roles');
const { authRequired } = require('../middlewares/auth');

const ctrl = require('../controllers/reports.controller');

const r = Router();
r.use(authRequired, requireRole('TECH', 'ADMIN'));

r.get('/usage', ctrl.usage);
r.get('/inventory', ctrl.inventory);
r.get('/maintenance', ctrl.maintenance);
r.get('/export', ctrl.exportReport);

module.exports = r;



