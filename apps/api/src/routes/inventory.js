const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const ctrl = require('../controllers/inventory.controller');

const r = Router();
r.use(authRequired, requireRole('TECH','ADMIN'));

/** Equipos (EQUIPO) */
r.post('/equipment', ctrl.createEquipment);
r.patch('/equipment/:id', ctrl.updateEquipment);
r.delete('/equipment/:id', ctrl.deactivateEquipment);

/** Materiales (MATERIAL) */
r.post('/materials', ctrl.createMaterial);
r.post('/materials/:id/stock', ctrl.adjustMaterialStock);  // delta (+IN / -OUT)
r.get('/materials/low-stock', ctrl.listLowStock);

/** Estados y consulta general */
r.get('/resources', ctrl.listResources);
r.post('/resources/:id/status', ctrl.setResourceStatus);

/** Movimientos manuales (cualquier recurso) */
r.post('/movements', ctrl.createMovement);                 // IN/OUT + reason

module.exports = r;
