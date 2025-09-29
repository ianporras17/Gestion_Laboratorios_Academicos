// apps/api/src/routes/requests.routes.js
const express = require('express');
const RequestsController = require('../controllers/requests.controller');

const router = express.Router();
const w = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Crear y listar
router.post('/', w((req, res, next) => RequestsController.create(req, res, next)));
router.get('/',  w((req, res, next) => RequestsController.list(req, res, next)));
router.get('/:id', w((req, res, next) => RequestsController.get(req, res, next)));

// Acciones
router.post('/:id/approve',   w((req, res, next) => RequestsController.approve(req, res, next)));
router.post('/:id/reject',    w((req, res, next) => RequestsController.reject(req, res, next)));
router.post('/:id/need-info', w((req, res, next) => RequestsController.needInfo(req, res, next)));

// Mensajes (para “Solicitar información adicional” ida y vuelta)
router.post('/:id/messages',  w((req, res, next) => RequestsController.addMessage(req, res, next)));

module.exports = router;
