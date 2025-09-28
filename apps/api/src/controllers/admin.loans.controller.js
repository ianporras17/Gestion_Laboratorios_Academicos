const { param, body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const updateLoanValidators = [
  param('id').isUUID(),
  body('status').isIn(['requested','approved','picked_up','returned','rejected','cancelled','overdue'])
];

async function adminUpdateLoanStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const { status } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cur = await client.query(
      `SELECT user_id, resource_id, status AS old_status
         FROM loans WHERE id=$1 FOR UPDATE`,
      [id]
    );
    if (!cur.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error:'Loan not found' });
    }
    const { user_id, resource_id, old_status } = cur.rows[0];

    await client.query(`UPDATE loans SET status=$2 WHERE id=$1`, [id, status]);

    // Notificación al dueño del préstamo
    await client.query(
    `INSERT INTO user_notifications (user_id, type, title, message, data)
    VALUES ($1, 'loan_status',
            $2, $3, $4)`,
    [
        user_id,
        `Préstamo ${status.toUpperCase()}`,
        `Tu préstamo ${id} cambió de estado a ${status}`,
        { loan_id: id, new_status: status }
    ]
    );

    // Datos de trazabilidad
    const labQ = await client.query(`SELECT lab_id FROM resources WHERE id=$1`, [resource_id]);
    const labId = labQ.rows[0]?.lab_id || null;

    // Tipo de actividad
    let type = 'loan_status_changed';
    if (status === 'returned') type = 'loan_returned';

    // META como JSONB: serializa en Node y castea en SQL
    const meta = JSON.stringify({ old: old_status, new: status });

    await client.query(
      `INSERT INTO user_activity_log
         (user_id, activity_type, event_time, lab_id, resource_id, loan_id, meta)
       VALUES ($1, $2, now(), $3, $4, $5, $6::jsonb)`,
      [user_id, type, labId, resource_id, id, meta]
    );

    // Notificación (data es JSONB)
    const notif = JSON.stringify({ loan_id: id, old_status, new_status: status });
    await client.query(
      `INSERT INTO user_notifications (user_id, type, title, message, data)
       VALUES ($1, 'loan_status',
               $2, $3, $4::jsonb)`,
      [
        user_id,
        `Préstamo ${status.toUpperCase()}`,
        `Tu préstamo ${id} cambió de estado: ${old_status} → ${status}`,
        notif
      ]
    );

    await client.query('COMMIT');
    return res.json({ ok:true, old_status, new_status: status });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[adminUpdateLoanStatus] error:', e);
    return res.status(500).json({ error: 'Failed to update loan status' });
  } finally {
    client.release();
  }
}

module.exports = { updateLoanValidators, adminUpdateLoanStatus };
