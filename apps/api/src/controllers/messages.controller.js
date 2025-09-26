const { body, param, validationResult } = require('express-validator');
const pool = require('../db/pool');

const createThreadValidators = [
  body('context_type').isIn(['reservation','loan']),
  body('context_id').isUUID()
];

const threadIdParam = [ param('id').isUUID() ];
const sendValidators  = [ body('body').isString().notEmpty().isLength({ max: 4000 }) ];

// Devuelve el lab_id asociado a la reserva o al préstamo
async function resolveLabId(client, context_type, context_id) {
  if (context_type === 'reservation') {
    // No necesitamos unir con labs: lab_id está en resources
    const q = await client.query(`
      SELECT rs.lab_id AS lab_id
      FROM reservations rv
      JOIN resources rs ON rs.id = rv.resource_id
      WHERE rv.id = $1
    `, [context_id]);
    return q.rows[0]?.lab_id || null;
  } else {
    // loans -> resource -> lab_id
    const q = await client.query(`
      SELECT rs.lab_id AS lab_id
      FROM loans ln
      JOIN resources rs ON rs.id = ln.resource_id
      WHERE ln.id = $1
    `, [context_id]);
    return q.rows[0]?.lab_id || null;
  }
}

async function assertUserOwnsContext(client, userId, context_type, context_id) {
  const q = await client.query(
    context_type === 'reservation'
      ? `SELECT 1 FROM reservations WHERE id=$1 AND user_id=$2`
      : `SELECT 1 FROM loans WHERE id=$1 AND user_id=$2`,
    [context_id, userId]
  );
  return q.rowCount > 0;
}

// Crea o devuelve el hilo para una solicitud
async function createOrGetThread(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { context_type, context_id } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validar que el usuario es dueño de la solicitud
    const isMine = await assertUserOwnsContext(client, userId, context_type, context_id);
    if (!isMine) { await client.query('ROLLBACK'); return res.status(403).json({ error:'Forbidden' }); }

    // Existe hilo?
    let thr = await client.query(
      `SELECT * FROM message_threads WHERE context_type=$1 AND context_id=$2`,
      [context_type, context_id]
    );

    if (!thr.rowCount) {
      const labId = await resolveLabId(client, context_type, context_id);
      const ins = await client.query(
        `INSERT INTO message_threads(context_type, context_id, lab_id, created_by)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [context_type, context_id, labId, userId]
      );
      thr = { rows: [ins.rows[0]] };

      // Participantes: solicitante + staff del lab
      await client.query(
        `INSERT INTO message_thread_participants(thread_id, user_id, last_read_at)
         VALUES ($1,$2,now())`,
        [ins.rows[0].id, userId]
      );
      await client.query(
        `INSERT INTO message_thread_participants(thread_id, user_id)
         SELECT $1, ls.user_id FROM lab_staff ls WHERE ls.lab_id = $2
         ON CONFLICT DO NOTHING`,
        [ins.rows[0].id, ins.rows[0].lab_id]
      );
    } else {
      // Asegura que el usuario es participante
      await client.query(
        `INSERT INTO message_thread_participants(thread_id, user_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [thr.rows[0].id, userId]
      );
    }

    await client.query('COMMIT');
    return res.json(thr.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[createOrGetThread]', e);
    return res.status(500).json({ error:'Failed to open thread' });
  } finally {
    client.release();
  }
}

// Listar hilos del usuario con último mensaje + conteo de no leídos (robusto con LATERAL)
async function listMyThreads(req, res) {
  const userId = req.user.id;
  const limit  = parseInt(req.query.limit ?? '50', 10);
  const offset = parseInt(req.query.offset ?? '0', 10);

  try {
    const q = await pool.query(
      `
      SELECT
        t.*,
        la.name AS lab_name,
        la.location,
        lm.last_message,
        lm.last_created_at,
        COALESCE(uc.unread_count, 0) AS unread_count
      FROM message_threads t
      -- Asegura pertenencia del usuario al hilo
      JOIN message_thread_participants me
        ON me.thread_id = t.id AND me.user_id = $1
      LEFT JOIN labs la ON la.id = t.lab_id

      -- Último mensaje (objeto y fecha) como columnas gracias a LATERAL
      LEFT JOIN LATERAL (
        SELECT
          row_to_json(m) AS last_message,
          m.created_at   AS last_created_at
        FROM (
          SELECT ms.id, ms.body, ms.created_at, u.full_name AS sender_name
          FROM messages ms
          JOIN users u ON u.id = ms.sender_id
          WHERE ms.thread_id = t.id
          ORDER BY ms.created_at DESC
          LIMIT 1
        ) m
      ) lm ON TRUE

      -- No leídos para este usuario (usa me.last_read_at)
      LEFT JOIN LATERAL (
        SELECT COUNT(1)::int AS unread_count
        FROM messages ms
        WHERE ms.thread_id = t.id
          AND (me.last_read_at IS NULL OR ms.created_at > me.last_read_at)
      ) uc ON TRUE

      ORDER BY COALESCE(lm.last_created_at, t.created_at) DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    );

    return res.json(q.rows);
  } catch (e) {
    console.error('[listMyThreads] error:', e);
    return res.status(500).json({ error: 'Failed to list threads' });
  }
}


// Enviar mensaje
async function sendMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const { body: text } = req.body;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validar participación
    const p = await client.query(
      `SELECT 1 FROM message_thread_participants WHERE thread_id=$1 AND user_id=$2`,
      [id, userId]
    );
    if (!p.rowCount) { await client.query('ROLLBACK'); return res.status(403).json({ error:'Forbidden' }); }

    const ins = await client.query(
      `INSERT INTO messages(thread_id, sender_id, body)
       VALUES ($1,$2,$3)
       RETURNING id, thread_id, sender_id, body, created_at`,
      [id, userId, text]
    );

    // Notificar a los otros participantes
    const others = await client.query(
      `SELECT user_id FROM message_thread_participants WHERE thread_id=$1 AND user_id<>$2`,
      [id, userId]
    );
    const notifJSON = JSON.stringify({ thread_id: id, snippet: text.slice(0,140) });
    for (const row of others.rows) {
      await client.query(
        `INSERT INTO user_notifications (user_id, type, title, message, data)
         VALUES ($1, 'message', 'Nuevo mensaje', $2, $3::jsonb)`,
        [row.user_id, text.slice(0,120), notifJSON]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json(ins.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[sendMessage]', e);
    return res.status(500).json({ error:'Failed to send message' });
  } finally {
    client.release();
  }
}

// Listar mensajes del hilo
async function listMessages(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const p = await pool.query(
      `SELECT 1 FROM message_thread_participants WHERE thread_id=$1 AND user_id=$2`,
      [id, userId]
    );
    if (!p.rowCount) return res.status(403).json({ error:'Forbidden' });

    const q = await pool.query(`
      SELECT m.id, m.thread_id, m.body, m.created_at,
             m.sender_id, u.full_name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.thread_id=$1
      ORDER BY m.created_at ASC
    `, [id]);
    return res.json(q.rows);
  } catch (e) {
    console.error('[listMessages]', e);
    return res.status(500).json({ error:'Failed to load messages' });
  }
}

// Marcar como leído
async function markRead(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.query(`
      UPDATE message_thread_participants
      SET last_read_at = now()
      WHERE thread_id=$1 AND user_id=$2
    `, [id, userId]);
    return res.json({ ok:true });
  } catch (e) {
    console.error('[markRead]', e);
    return res.status(500).json({ error:'Failed to mark read' });
  }
}

module.exports = {
  createThreadValidators,
  threadIdParam,
  sendValidators,
  createOrGetThread,
  listMyThreads,
  sendMessage,
  listMessages,
  markRead
};
