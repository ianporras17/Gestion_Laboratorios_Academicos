const { Router } = require('express');
const { generalICS, labICS } = require('../controllers/calendar.controller');

const router = Router();
// públicos de solo lectura (no requieren JWT)
router.get('/general.ics', generalICS);
router.get('/labs/:labId.ics', labICS);

module.exports = router;
