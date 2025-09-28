const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const departmentsController = require('../controllers/school-departments.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

// Middleware de autenticación para todas las rutas
router.use(auth);

// Validaciones
const departmentValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido').isLength({ max: 120 }).withMessage('El nombre no puede exceder 120 caracteres'),
  body('email_domain').notEmpty().withMessage('El dominio de email es requerido').isLength({ max: 120 }).withMessage('El dominio de email no puede exceder 120 caracteres'),
  body('description').optional().isLength({ max: 500 }).withMessage('La descripción no puede exceder 500 caracteres')
];

/**
 * @route GET /api/school-departments
 * @desc Obtener todos los departamentos escolares
 * @access Public (solo lectura)
 */
router.get('/', [
  query('is_active').optional().isBoolean().withMessage('is_active debe ser un valor booleano'),
  query('search').optional().isLength({ max: 100 }).withMessage('El término de búsqueda no puede exceder 100 caracteres')
], departmentsController.getAllDepartments);

/**
 * @route GET /api/school-departments/:id
 * @desc Obtener un departamento por ID
 * @access Public (solo lectura)
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID de departamento inválido')
], departmentsController.getDepartmentById);

/**
 * @route POST /api/school-departments
 * @desc Crear un nuevo departamento
 * @access Admin
 */
router.post('/', [
  ...departmentValidation
], requireRole('admin'), departmentsController.createDepartment);

/**
 * @route PUT /api/school-departments/:id
 * @desc Actualizar un departamento
 * @access Admin
 */
router.put('/:id', [
  param('id').isUUID().withMessage('ID de departamento inválido'),
  ...departmentValidation.map(validation => validation.optional()),
  body('is_active').optional().isBoolean().withMessage('is_active debe ser un valor booleano')
], requireRole('admin'), departmentsController.updateDepartment);

/**
 * @route DELETE /api/school-departments/:id
 * @desc Eliminar un departamento (soft delete)
 * @access Admin
 */
router.delete('/:id', [
  param('id').isUUID().withMessage('ID de departamento inválido')
], requireRole('admin'), departmentsController.deleteDepartment);

module.exports = router;
