const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const {
  searchValidators, searchResources,
  policiesValidators, getPolicies,
  availabilityValidators, getAvailability
} = require('../controllers/resources.controller');

const router = Router();

// Búsqueda con filtros + filtros avanzados por rol/requisitos
router.get('/search', authRequired, searchValidators, searchResources);

// Políticas y requisitos de un recurso
router.get('/:id/policies', authRequired, policiesValidators, getPolicies);

// Disponibilidad (semana/mes o rango)
router.get('/:id/availability', authRequired, availabilityValidators, getAvailability);

module.exports = router;
