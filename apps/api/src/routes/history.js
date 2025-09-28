const { Router } = require('express');
const { authRequired } = require('../middlewares/auth');
const { myHistory, mySummary, exportMyHistory } = require('../controllers/history.controller');
const { loanCreateValidators, loanReturnValidators, logLoanCreated, logLoanReturned } =
  require('../controllers/history.loans.controller');
const router = Router();

router.get('/me', authRequired, myHistory);            // ?from=&to=&type=all|reservations|loans|training
router.get('/me/summary', authRequired, mySummary);    // ?from=&to=
router.get('/me/export', authRequired, exportMyHistory); // ?from=&to=&type=&format=excel|pdf

router.post('/loans/create', authRequired, loanCreateValidators, logLoanCreated);
router.post('/loans/return', authRequired, loanReturnValidators, logLoanReturned);

module.exports = router;
