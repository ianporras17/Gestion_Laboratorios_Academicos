const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const pool = require('../db/pool');

const loanCreateValidators = [
  body('resource_id').isUUID(),
  body('lab_id').optional().isUUID(),
  body('notes').optional().isString().isLength({ max: 1000 })
];

const loanReturnValidators = [
  body('loan_id').isUUID(),
  body('notes').optional().isString().isLength({ max: 1000 })
];

// Crea un préstamo (solo bitácora; integra con tu módulo de préstamos cuando exista)
async function logLoanCreated(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const { resource_id, lab_id = null, notes = null } = req.body;
  const loan_id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO user_activity_log (user_id, activity_type, event_time, lab_id, resource_id, loan_id, meta)
     VALUES ($1,'loan_created', now(), $2, $3, $4, $5)`,
    [userId, lab_id, resource_id, loan_id, notes ? { notes } : null]
  );

  return res.status(201).json({ loan_id });
}

// Registra devolución y copia lab/recurso del préstamo original
async function logLoanReturned(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const { loan_id, notes = null } = req.body;

  const q = await pool.query(
    `SELECT lab_id, resource_id FROM user_activity_log
      WHERE user_id=$1 AND loan_id=$2 AND activity_type='loan_created'
      ORDER BY event_time DESC LIMIT 1`,
    [userId, loan_id]
  );
  if (!q.rowCount) return res.status(404).json({ error: 'Loan not found for this user' });

  const { lab_id, resource_id } = q.rows[0];

  await pool.query(
    `INSERT INTO user_activity_log (user_id, activity_type, event_time, lab_id, resource_id, loan_id, meta)
     VALUES ($1,'loan_returned', now(), $2, $3, $4, $5)`,
    [userId, lab_id, resource_id, loan_id, notes ? { notes } : null]
  );

  return res.json({ ok: true });
}

module.exports = {
  loanCreateValidators,
  loanReturnValidators,
  logLoanCreated,
  logLoanReturned,
};
