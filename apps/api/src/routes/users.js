const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const {
  getMe,
  updateValidators,
  updateMe,
  getMyCerts,
  certValidators,
  addMyCert
} = require('../controllers/users.controller');

const router = Router();

router.get('/me', authRequired, getMe);
router.put('/me', authRequired, updateValidators, updateMe);

router.get('/me/certifications', authRequired, getMyCerts);
router.post('/me/certifications', authRequired, certValidators, addMyCert);

module.exports = router;
