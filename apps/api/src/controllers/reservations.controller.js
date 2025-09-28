const { body, param, validationResult } = require('express-validator');
const pool = require('../db/pool');

// ---------- Validadores ----------
const createValidators = [
  body('resource_id').isUUID().withMessage('resource_id must be UUID'),
  body('start_time').isISO8601().withMessage('start_time must be ISO8601'),
  body('end_time').isISO8601().withMessage('end_time must be ISO8601'),
  body('reason').optional().isString().isLength({ max: 1000 }),
];

const idParamValidator = [ param('id').isUUID().withMessage('Invalid reservation id') ];

// ---------- Helpers ----------
async function userMeetsRequirements(client, userId, resourceId, role) {
  // 1) Rol permitido
  const r = await client.query(`SELECT allowed_roles FROM resources WHERE id = $1`, [resourceId]);
  if (!r.rowCount) return { ok:false, message:'Resource not found' };
  const allowed = r.rows[0].allowed_roles || [];
  if (!allowed.includes(role)) return { ok:false, message:'Role not allowed for this resource' };

  // 2) Certificaciones requeridas
  const miss = await client.query(`
    SELECT c.code
      FROM resource_required_certifications rc
      JOIN certifications c ON c.id = rc.certification_id
      LEFT JOIN user_certifications uc
        ON uc.certification_id = rc.certification_id AND uc.user_id = $1
     WHERE rc.resource_id = $2 AND uc.user_id IS NULL
  `, [userId, resourceId]);

  if (miss.rowCount) {
    return { ok:false, message:'Missing required certifications', missing: miss.rows.map(x=>x.code) };
  }
  return { ok:true };
}

async function hasOverlap(client, resourceId, start, end) {
  const q = await client.query(`
    SELECT 1 FROM reservations
     WHERE resource_id=$1
       AND status IN ('in_review','pending','approved')
       AND start_time < $3 AND end_time > $2
     LIMIT 1
  `, [resourceId, start, end]);
  return q.rowCount > 0;
}

// ---------- Crear solicitud ----------
async function createReservation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const userId = req.user.id;
  const role = req.user.role;
  const { resource_id, start_time, end_time, reason } = req.body;

  const start = new Date(start_time);
  const end   = new Date(end_time);
  if (!(start < end)) return res.status(422).json({ error: 'end_time must be after start_time' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validación requisitos + disponibilidad
    const reqs = await userMeetsRequirements(client, userId, resource_id, role);
    if (!reqs.ok) { await client.query('ROLLBACK'); return res.status(422).json({ error: reqs.message, missing: reqs.missing || [] }); }

    if (await hasOverlap(client, resource_id, start, end)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time range overlaps with an existing reservation' });
    }

    // Inserción
    const ins = await client.query(`
      INSERT INTO reservations(resource_id, user_id, start_time, end_time, status)
      VALUES ($1,$2,$3,$4,'in_review')
      RETURNING id, resource_id, user_id, start_time, end_time, status, created_at
    `, [resource_id, userId, start, end]);
    const reservation = ins.rows[0];

    // Adjuntos (si vienen en multipart)
    if (Array.isArray(req.files) && req.files.length > 0) {
      const values = [];
      const params = [reservation.id];
      req.files.forEach((f, i) => {
        values.push(`($1,$${i*4+2},$${i*4+3},$${i*4+4},$${i*4+5})`);
        params.push(f.path, f.originalname, f.mimetype, f.size);
      });
      await client.query(`
        INSERT INTO reservation_attachments(reservation_id, file_path, original_name, mime_type, size_bytes)
        VALUES ${values.join(',')}
      `, params);
    }

        // Obtener lab_id del recurso para trazar
    const labQ = await client.query(`SELECT lab_id FROM resources WHERE id=$1`, [resource_id]);
    const labId = labQ.rows[0]?.lab_id || null;

    // Log de actividad: solicitud creada
    await client.query(
      `INSERT INTO user_activity_log
      (user_id, activity_type, event_time, lab_id, resource_id, reservation_id, meta)
      VALUES ($1,'reservation_created', now(), $2, $3, $4, $5)`,
      [userId, labId, resource_id, reservation.id, { reason }]
    );

    await client.query('COMMIT');
    return res.status(201).json({ reservation });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[createReservation]', e);
    return res.status(500).json({ error: 'Failed to create reservation' });
  } finally {
    client.release();
  }
}

// ---------- Mis solicitudes ----------
async function listMyReservations(req, res) {
  const userId = req.user.id;
  const { limit = 50, offset = 0 } = req.query;

  const client = await pool.connect();
  try {
    const q = await client.query(`
      SELECT rv.id, rv.status, rv.start_time, rv.end_time, rv.created_at,
             r.id AS resource_id, r.name AS resource_name, r.type,
             l.id AS lab_id, l.name AS lab_name, l.location,
             COALESCE((
               SELECT json_agg(row_to_json(x)) FROM (
                 SELECT id, original_name, mime_type, size_bytes, file_path
                   FROM reservation_attachments
                  WHERE reservation_id=rv.id
                  ORDER BY uploaded_at ASC
               ) x
             ), '[]') AS attachments
        FROM reservations rv
        JOIN resources r ON r.id = rv.resource_id
        JOIN labs l      ON l.id = r.lab_id
       WHERE rv.user_id = $1
       ORDER BY rv.created_at DESC
       LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return res.json(q.rows);
  } catch (e) {
    console.error('[listMyReservations]', e);
    return res.status(500).json({ error: 'Failed to list reservations' });
  } finally {
    client.release();
  }
}

// ---------- Detalle ----------
async function getReservation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    const q = await client.query(`
      SELECT rv.*, r.name AS resource_name, l.name AS lab_name, l.location
        FROM reservations rv
        JOIN resources r ON r.id = rv.resource_id
        JOIN labs l      ON l.id = r.lab_id
       WHERE rv.id=$1
    `, [id]);

    if (!q.rowCount) return res.status(404).json({ error:'Reservation not found' });

    const row = q.rows[0];
    if (row.user_id !== userId) return res.status(403).json({ error:'Forbidden' });

    return res.json(row);
  } catch (e) {
    console.error('[getReservation]', e);
    return res.status(500).json({ error: 'Failed to get reservation' });
  } finally {
    client.release();
  }
}

// ---------- Cancelar ----------
async function cancelReservation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query(
      `SELECT status, start_time FROM reservations WHERE id=$1 AND user_id=$2 FOR UPDATE`,
      [id, userId]
    );
    if (!cur.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error:'Reservation not found' }); }

    const { status, start_time } = cur.rows[0];
    const now = new Date();
    const startsInFuture = new Date(start_time) > now;

    if (status === 'approved' && !startsInFuture) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'Cannot cancel an approved reservation that already started' });
    }
    if (!['in_review','pending','approved'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: `Cannot cancel in current status (${status})` });
    }

    await client.query(`UPDATE reservations SET status='cancelled' WHERE id=$1`, [id]);
    
    // Traza para historial
    const info = await client.query(`
      SELECT rv.resource_id, r.lab_id
      FROM reservations rv
      JOIN resources r ON r.id = rv.resource_id
      WHERE rv.id = $1
    `, [id]);

    await client.query(
      `INSERT INTO user_activity_log
      (user_id, activity_type, event_time, lab_id, resource_id, reservation_id)
      VALUES ($1,'reservation_cancelled', now(), $2, $3, $4)`,
      [userId, info.rows[0].lab_id, info.rows[0].resource_id, id]
    );
    
    await client.query('COMMIT');
    return res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[cancelReservation]', e);
    return res.status(500).json({ error: 'Failed to cancel reservation' });
  } finally {
    client.release();
  }
}

module.exports = {
  createValidators,
  idParamValidator,
  createReservation,
  listMyReservations,
  getReservation,
  cancelReservation
};
