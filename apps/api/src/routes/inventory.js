const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const ctrl = require('../controllers/inventory.controller');

const r = Router();
r.use(authRequired, requireRole('TECH','ADMIN'));

/** Equipos (EQUIPO) */
r.post('/equipment', ctrl.createEquipment);               // alta
r.patch('/equipment/:id', ctrl.updateEquipment);          // edición
r.delete('/equipment/:id', ctrl.deactivateEquipment);     // baja (INACTIVO)

/** Materiales (MATERIAL) */
r.post('/materials', ctrl.createMaterial);                // alta
r.post('/materials/:id/stock', ctrl.adjustMaterialStock); // IN/OUT con motivo
r.get('/materials/low-stock', ctrl.listLowStock);         // alertas (stock < min_stock)

/** Estados y consulta general */
r.get('/resources', ctrl.listResources);                  // listar con filtros
r.post('/resources/:id/status', ctrl.setResourceStatus);  // cambiar estado

/** Movimientos manuales (cualquier recurso) */
r.post('/movements', ctrl.createMovement);                // IN/OUT + reason

module.exports = r;
