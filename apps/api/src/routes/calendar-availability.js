const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const calendarController = require('../controllers/calendar.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

// Middleware de autenticación para todas las rutas
router.use(auth);

// Validaciones
const calendarSlotValidation = [
  body('lab_id').isUUID().withMessage('ID de laboratorio inválido'),
  body('resource_id').optional().isUUID().withMessage('ID de recurso inválido'),
  body('starts_at').isISO8601().withMessage('Fecha de inicio inválida'),
  body('ends_at').isISO8601().withMessage('Fecha de fin inválida'),
  body('status').optional().isIn(['DISPONIBLE','BLOQUEADO','RESERVADO','MANTENIMIENTO','EXCLUSIVO'])
    .withMessage('Estado inválido'),
  body('reason').optional().isLength({ max: 160 }).withMessage('El motivo no puede exceder 160 caracteres')
];

/**
 * @route GET /api/calendar/slots
 * @desc Obtener slots del calendario
 * @access Public (solo lectura)
 */
router.get('/slots', [
  query('lab_id').optional().isUUID().withMessage('ID de laboratorio inválido'),
  query('resource_id').optional().isUUID().withMessage('ID de recurso inválido'),
  query('start_date').optional().isISO8601().withMessage('Fecha de inicio inválida'),
  query('end_date').optional().isISO8601().withMessage('Fecha de fin inválida'),
  query('status').optional().isIn(['DISPONIBLE','BLOQUEADO','RESERVADO','MANTENIMIENTO','EXCLUSIVO'])
    .withMessage('Estado inválido')
], calendarController.getCalendarSlots);

/**
 * @route POST /api/calendar/slots
 * @desc Crear un nuevo slot del calendario
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.post('/slots', [
  ...calendarSlotValidation
], requireRole('admin', 'tech_manager', 'lab_owner'), calendarController.createCalendarSlot);

/**
 * @route GET /api/calendar/weekly
 * @desc Obtener vista semanal del calendario
 * @access Public (solo lectura)
 */
router.get('/weekly', [
  query('lab_id').optional().isUUID().withMessage('ID de laboratorio inválido'),
  query('resource_id').optional().isUUID().withMessage('ID de recurso inválido'),
  query('week_start').isISO8601().withMessage('Fecha de inicio de semana inválida')
], calendarController.getWeeklyView);

/**
 * @route GET /api/calendar/monthly
 * @desc Obtener vista mensual del calendario
 * @access Public (solo lectura)
 */
router.get('/monthly', [
  query('lab_id').optional().isUUID().withMessage('ID de laboratorio inválido'),
  query('resource_id').optional().isUUID().withMessage('ID de recurso inválido'),
  query('year').isInt({ min: 2020, max: 2030 }).withMessage('Año inválido'),
  query('month').isInt({ min: 1, max: 12 }).withMessage('Mes inválido')
], calendarController.getMonthlyView);

/**
 * @route POST /api/calendar/subscribe
 * @desc Suscribirse a notificaciones de disponibilidad
 * @access Authenticated
 */
router.post('/subscribe', [
  body('lab_id').optional().isUUID().withMessage('ID de laboratorio inválido'),
  body('resource_id').optional().isUUID().withMessage('ID de recurso inválido'),
  body().custom((value) => {
    if (!value.lab_id && !value.resource_id) {
      throw new Error('Debe especificar lab_id o resource_id');
    }
    return true;
  })
], calendarController.subscribeToAvailability);

/**
 * @route DELETE /api/calendar/subscribe/:subscription_id
 * @desc Cancelar suscripción a notificaciones
 * @access Authenticated
 */
router.delete('/subscribe/:subscription_id', [
  param('subscription_id').isUUID().withMessage('ID de suscripción inválido')
], calendarController.unsubscribeFromAvailability);

module.exports = router;
