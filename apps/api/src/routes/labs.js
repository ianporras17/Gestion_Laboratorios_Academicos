const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const labsController = require('../controllers/labs.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

// =========================
// MÓDULO 1.1: GESTIÓN DE PERFILES DE LABORATORIO
// =========================

// Middleware de autenticación para todas las rutas
router.use(auth);

// Validaciones comunes
const labValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido').isLength({ max: 160 }).withMessage('El nombre no puede exceder 160 caracteres'),
  body('internal_code').notEmpty().withMessage('El código interno es requerido').isLength({ max: 60 }).withMessage('El código interno no puede exceder 60 caracteres'),
  body('school_dept_id').isUUID().withMessage('ID de departamento inválido'),
  body('email_contact').isEmail().withMessage('Email de contacto inválido').isLength({ max: 160 }).withMessage('El email no puede exceder 160 caracteres'),
  body('location').notEmpty().withMessage('La ubicación es requerida').isLength({ max: 200 }).withMessage('La ubicación no puede exceder 200 caracteres'),
  body('description').optional().isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
  body('capacity_max').optional().isInt({ min: 1 }).withMessage('La capacidad máxima debe ser un número entero positivo')
];

const responsibleValidation = [
  body('full_name').notEmpty().withMessage('El nombre completo es requerido').isLength({ max: 160 }).withMessage('El nombre no puede exceder 160 caracteres'),
  body('position_title').notEmpty().withMessage('El cargo es requerido').isLength({ max: 120 }).withMessage('El cargo no puede exceder 120 caracteres'),
  body('phone').optional().isLength({ max: 40 }).withMessage('El teléfono no puede exceder 40 caracteres'),
  body('email').isEmail().withMessage('Email inválido').isLength({ max: 160 }).withMessage('El email no puede exceder 160 caracteres'),
  body('is_primary').optional().isBoolean().withMessage('is_primary debe ser un valor booleano')
];

const policiesValidation = [
  body('academic_req').optional().isLength({ max: 2000 }).withMessage('Los requisitos académicos no pueden exceder 2000 caracteres'),
  body('safety_req').optional().isLength({ max: 2000 }).withMessage('Los requisitos de seguridad no pueden exceder 2000 caracteres'),
  body('notes').optional().isLength({ max: 2000 }).withMessage('Las notas no pueden exceder 2000 caracteres')
];

const openHoursValidation = [
  body('weekday').isInt({ min: 0, max: 6 }).withMessage('El día de la semana debe ser un número entre 0 y 6'),
  body('time_start').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora de inicio inválido (HH:MM)'),
  body('time_end').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora de fin inválido (HH:MM)')
];

// =========================
// RUTAS PÚBLICAS (Solo lectura)
// =========================

/**
 * @route GET /api/labs
 * @desc Obtener todos los laboratorios
 * @access Public (solo lectura)
 */
router.get('/', [
  query('school_dept_id').optional().isUUID().withMessage('ID de departamento inválido'),
  query('is_active').optional().isBoolean().withMessage('is_active debe ser un valor booleano'),
  query('search').optional().isLength({ max: 100 }).withMessage('El término de búsqueda no puede exceder 100 caracteres')
], labsController.getAllLabs);

/**
 * @route GET /api/labs/:id
 * @desc Obtener un laboratorio por ID
 * @access Public (solo lectura)
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID de laboratorio inválido')
], labsController.getLabById);

/**
 * @route GET /api/labs/:id/history
 * @desc Obtener historial del laboratorio
 * @access Public (solo lectura)
 */
router.get('/:id/history', [
  param('id').isUUID().withMessage('ID de laboratorio inválido'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100'),
  query('action_type').optional().isLength({ max: 60 }).withMessage('El tipo de acción no puede exceder 60 caracteres')
], labsController.getLabHistory);

// =========================
// RUTAS PROTEGIDAS (Requieren autenticación y roles específicos)
// =========================

/**
 * @route POST /api/labs
 * @desc Crear un nuevo laboratorio
 * @access Admin, EncargadoTecnico
 */
router.post('/', [
  ...labValidation,
  body('responsibles').optional().isArray().withMessage('Los responsables deben ser un array'),
  body('responsibles.*').optional().custom((value) => {
    if (typeof value !== 'object') {
      throw new Error('Cada responsable debe ser un objeto');
    }
    return true;
  }),
  body('policies').optional().isObject().withMessage('Las políticas deben ser un objeto'),
  body('open_hours').optional().isArray().withMessage('Los horarios deben ser un array'),
  body('open_hours.*').optional().custom((value) => {
    if (typeof value !== 'object') {
      throw new Error('Cada horario debe ser un objeto');
    }
    return true;
  })
], requireRole('admin', 'tech_manager'), labsController.createLab);

/**
 * @route PUT /api/labs/:id
 * @desc Actualizar un laboratorio
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID de laboratorio inválido'),
  ...labValidation.map(validation => validation.optional()),
  body('is_active').optional().isBoolean().withMessage('is_active debe ser un valor booleano')
], requireRole('admin', 'tech_manager', 'lab_owner'), labsController.updateLab);

/**
 * @route POST /api/labs/:id/responsibles
 * @desc Gestionar responsables del laboratorio
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.post('/:id/responsibles', [
  param('id').isUUID().withMessage('ID de laboratorio inválido'),
  body('action').isIn(['add', 'update', 'delete']).withMessage('Acción inválida'),
  body('responsible').isObject().withMessage('Los datos del responsable son requeridos'),
  body('responsible.id').optional().isUUID().withMessage('ID de responsable inválido'),
  ...responsibleValidation
], requireRole('admin', 'tech_manager', 'lab_owner'), labsController.manageResponsibles);

/**
 * @route PUT /api/labs/:id/policies
 * @desc Gestionar políticas del laboratorio
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.put('/:id/policies', [
  param('id').isUUID().withMessage('ID de laboratorio inválido'),
  ...policiesValidation
], requireRole('admin', 'tech_manager', 'lab_owner'), labsController.managePolicies);

/**
 * @route POST /api/labs/:id/open-hours
 * @desc Gestionar horarios del laboratorio
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.post('/:id/open-hours', [
  param('id').isUUID().withMessage('ID de laboratorio inválido'),
  body('action').isIn(['replace', 'add', 'delete']).withMessage('Acción inválida'),
  body('hours').optional().isObject().withMessage('Los datos del horario son requeridos'),
  body('hours.id').optional().isUUID().withMessage('ID de horario inválido'),
  body('hours.weekday').optional().isInt({ min: 0, max: 6 }).withMessage('El día de la semana debe ser un número entre 0 y 6'),
  body('hours.time_start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora de inicio inválido (HH:MM)'),
  body('hours.time_end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora de fin inválido (HH:MM)')
], requireRole('admin', 'tech_manager', 'lab_owner'), labsController.manageOpenHours);

module.exports = router;
