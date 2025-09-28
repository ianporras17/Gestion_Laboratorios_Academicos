const { Router } = require('express');
const {
  register, registerValidators,
  login, loginValidators
} = require('../controllers/auth.controller');

const router = Router();
router.post('/register', registerValidators, register); // → /api/auth/register
router.post('/login', loginValidators, login);          // → /api/auth/login

module.exports = router;
