const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const ctrl = require('../controllers/maintenance.controller');

const r = Router();
r.use(authRequired, requireRole('TECH','ADMIN'));

r.post('/schedule', ctrl.schedule);
r.patch('/:id/start', ctrl.start);
r.patch('/:id/complete', ctrl.complete);
r.get('/', ctrl.list);
r.get('/:id', ctrl.getById);

module.exports = r;
