const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const ctrl = require('../controllers/approved.controller');

const r = Router();
r.use(authRequired, requireRole('TECH','ADMIN'));

r.get('/', ctrl.listApproved);
r.post('/:requestId/validate', ctrl.validateBeforeDelivery);
r.post('/:requestId/deliver', ctrl.createDelivery);
r.post('/deliveries/:deliveryId/return', ctrl.createReturn);
r.post('/:requestId/notify', ctrl.notifyIssues);

module.exports = r;
