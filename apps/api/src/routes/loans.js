const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const {
  maybeUpload, createValidators, idParam,
  createLoan, listMyLoans, getLoan, cancelLoan
} = require('../controllers/loans.controller');

const router = Router();

// Crear solicitud de préstamo (JSON o multipart con adjuntos)
router.post('/', authRequired, maybeUpload, createValidators, createLoan);

// Mis préstamos
router.get('/my', authRequired, listMyLoans);

// Detalle
router.get('/:id', authRequired, idParam, getLoan);

// Cancelar (antes de retiro)
router.patch('/:id/cancel', authRequired, idParam, cancelLoan);

module.exports = router;
