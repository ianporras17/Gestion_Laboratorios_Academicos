const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createValidators,
  idParamValidator,
  createReservation,
  listMyReservations,
  getReservation,
  cancelReservation
} = require('../controllers/reservations.controller');

const router = Router();

// --- Uploads (carpeta) ---
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g,'_');
    cb(null, `${ts}-${safe}`);
  }
});
const upload = multer({ storage });

// Aceptar JSON o multipart/form-data en la misma ruta
const maybeUpload = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.array('files', 5)(req, res, next);
  }
  return next();
};

// Crear solicitud
router.post('/', authRequired, maybeUpload, createValidators, createReservation);

// Mis solicitudes
router.get('/my', authRequired, listMyReservations);

// Detalle por id (con validador de UUID)
router.get('/:id', authRequired, idParamValidator, getReservation);

// Cancelar
router.patch('/:id/cancel', authRequired, idParamValidator, cancelReservation);

module.exports = router;
