const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const resourceCatalogController = require('../controllers/resource-catalog.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');

// Middleware de autenticación para todas las rutas
router.use(auth);

// Validaciones
const resourceStateValidation = [
  body('new_state').isIn(['DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO'])
    .withMessage('Estado inválido'),
  body('reason').optional().isLength({ max: 500 }).withMessage('El motivo no puede exceder 500 caracteres'),
  body('expires_at').optional().isISO8601().withMessage('Fecha de expiración inválida')
];

const photoValidation = [
  body('photo.url').isURL().withMessage('URL de foto inválida'),
  body('photo.caption').optional().isLength({ max: 200 }).withMessage('La descripción no puede exceder 200 caracteres'),
  body('photo.is_primary').optional().isBoolean().withMessage('is_primary debe ser un valor booleano')
];

/**
 * @route GET /api/resource-catalog
 * @desc Obtener catálogo de recursos
 * @access Public (solo lectura)
 */
router.get('/', [
  query('lab_id').optional().isUUID().withMessage('ID de laboratorio inválido'),
  query('type').optional().isIn(['EQUIPMENT','CONSUMABLE','SOFTWARE']).withMessage('Tipo inválido'),
  query('state').optional().isIn(['DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO']).withMessage('Estado inválido'),
  query('is_public').optional().isBoolean().withMessage('is_public debe ser un valor booleano'),
  query('search').optional().isLength({ max: 100 }).withMessage('El término de búsqueda no puede exceder 100 caracteres'),
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
], resourceCatalogController.getResourceCatalog);

/**
 * @route GET /api/resource-catalog/:id
 * @desc Obtener detalles de un recurso
 * @access Public (solo lectura)
 */
router.get('/:id', [
  param('id').isUUID().withMessage('ID de recurso inválido')
], resourceCatalogController.getResourceDetails);

/**
 * @route PUT /api/resource-catalog/:id/state
 * @desc Actualizar estado de disponibilidad de un recurso
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.put('/:id/state', [
  param('id').isUUID().withMessage('ID de recurso inválido'),
  ...resourceStateValidation
], requireRole('admin', 'tech_manager', 'lab_owner'), resourceCatalogController.updateResourceState);

/**
 * @route POST /api/resource-catalog/:id/photos
 * @desc Gestionar fotos de un recurso
 * @access Admin, EncargadoTecnico, LabOwner
 */
router.post('/:id/photos', [
  param('id').isUUID().withMessage('ID de recurso inválido'),
  body('action').isIn(['add', 'update', 'delete']).withMessage('Acción inválida'),
  body('photo').isObject().withMessage('Los datos de la foto son requeridos'),
  body('photo.id').optional().isUUID().withMessage('ID de foto inválido'),
  ...photoValidation
], requireRole('admin', 'tech_manager', 'lab_owner'), resourceCatalogController.manageResourcePhotos);

module.exports = router;
