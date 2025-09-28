const { param, body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const updateReservationValidators = [
  param('id').isUUID(),
  body('status').isIn(['in_review','pending','approved','rejected','cancelled'])
];

async function adminUpdateReservationStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const { status } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Trae contexto y bloquea fila
    const cur = await client.query(`
      SELECT rv.user_id, rv.status AS old_status,
             rv.start_time, rv.end_time,
             rs.id   AS resource_id, rs.lab_id,
             rs.name AS resource_name,
             lb.name AS lab_name
      FROM reservations rv
      JOIN resources rs ON rs.id = rv.resource_id
      JOIN labs lb      ON lb.id = rs.lab_id
      WHERE rv.id = $1
      FOR UPDATE
    `, [id]);

    if (!cur.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const {
      user_id, old_status, start_time, end_time,
      resource_id, lab_id, resource_name, lab_name
    } = cur.rows[0];

    if (old_status === status) {
      await client.query('ROLLBACK');
      return res.status(200).json({ ok: true, old_status, new_status: status });
    }

    // Actualiza estado
    await client.query(`UPDATE reservations SET status=$2 WHERE id=$1`, [id, status]);

    // Tipo de actividad + horas/créditos si corresponde
    let activityType = 'reservation_status_changed';
    let hours = 0, credits = 0;
    if (status === 'approved') {
      hours = Math.max(0, (new Date(end_time) - new Date(start_time)) / 36e5);
      hours = Math.round(hours * 100) / 100;
      credits = Math.round((hours / 10) * 100) / 100; // 1 crédito cada 10h (ajustable)
      activityType = 'reservation_approved';
    } else if (status === 'cancelled') {
      activityType = 'reservation_cancelled';
    }

    // META como JSONB (evita jsonb_build_object con parámetros sin tipo)
    const meta = JSON.stringify({ old: old_status, new: status });

    await client.query(
      `INSERT INTO user_activity_log
         (user_id, activity_type, event_time, lab_id, resource_id, reservation_id, hours, credits, meta)
       VALUES ($1, $2, now(), $3, $4, $5, $6, $7, $8::jsonb)`,
      [user_id, activityType, lab_id, resource_id, id, hours, credits, meta]
    );

    // Notificación al dueño (data jsonb)
    const titleMap = {
      approved:  'Reserva APROBADA',
      rejected:  'Reserva RECHAZADA',
      cancelled: 'Reserva CANCELADA',
      pending:   'Reserva en REVISIÓN',
      in_review: 'Reserva en REVISIÓN'
    };
    const when  = new Date(start_time).toLocaleString('es-CR');
    const notif = JSON.stringify({ reservation_id: id, old_status, new_status: status });

    await client.query(
      `INSERT INTO user_notifications (user_id, type, title, message, data)
       VALUES ($1, 'reservation_status', $2, $3, $4::jsonb)`,
      [
        user_id,
        titleMap[status] || `Reserva ${status.toUpperCase()}`,
        `${resource_name} — ${lab_name} (${when})`,
        notif
      ]
    );

    await client.query('COMMIT');
    return res.json({ ok: true, old_status, new_status: status });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[adminUpdateReservationStatus] error:', e);
    return res.status(500).json({ error: 'Failed to update reservation status' });
  } finally {
    client.release();
  }
}

module.exports = { updateReservationValidators, adminUpdateReservationStatus };
