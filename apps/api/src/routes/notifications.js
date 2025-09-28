const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { listMyNotifications, markReadValidators, markNotificationsRead } =
  require('../controllers/notifications.controller');

const router = Router();

router.get('/', authRequired, listMyNotifications);
router.patch('/read', authRequired, markReadValidators, markNotificationsRead);

module.exports = router;
