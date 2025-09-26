const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const {
  createThreadValidators, threadIdParam, sendValidators,
  createOrGetThread, listMyThreads, sendMessage, listMessages, markRead
} = require('../controllers/messages.controller');

const router = Router();

// Abrir o devolver hilo (por reserva/préstamo)
router.post('/threads', authRequired, createThreadValidators, createOrGetThread);

// Mis hilos
router.get('/threads/my', authRequired, listMyThreads);

// Mensajes del hilo
router.get('/threads/:id/messages', authRequired, threadIdParam, listMessages);

// Enviar mensaje
router.post('/threads/:id/messages', authRequired, threadIdParam, sendValidators, sendMessage);

// Marcar como leído
router.patch('/threads/:id/read', authRequired, threadIdParam, markRead);

module.exports = router;
