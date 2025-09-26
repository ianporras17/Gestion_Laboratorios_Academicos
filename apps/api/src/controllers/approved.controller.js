// apps/api/src/controllers/approved.controller.js
const pool = require('../db/pool');

/**
 * Util: trae solicitud + items + datos básicos de usuario y lab.
 */
async function fetchRequestWithItems(client, requestId) {
  const reqRes = await client.query(
    `
    SELECT r.id, r.user_id, r.lab_id, r.status, r.requested_at,
           u.full_name AS user_name, u.email AS user_email,
           l.name AS lab_name
    FROM requests r
    JOIN users u ON u.id = r.user_id
    JOIN laboratories l ON l.id = r.lab_id
    WHERE r.id = $1
    `,
    [requestId]
  );
  if (reqRes.rowCount === 0) return null;

  const itemsRes = await client.query(
    `
    SELECT ri.resource_id, ri.quantity,
           res.name AS resource_name, res.code AS resource_code, res.status AS resource_status
    FROM request_items ri
    JOIN resources res ON res.id = ri.resource_id
    WHERE ri.request_id = $1
    `,
    [requestId]
  );

  return { request: reqRes.rows[0], items: itemsRes.rows };
}

/**
 * Util: calcula certificaciones faltantes del usuario contra requisitos del laboratorio.
 * Devuelve: { missing: [{id, code, name}], required: [...ids], owned: [...ids] }
 */
async function computeMissingCertifications(client, labId, userId) {
  const reqRes = await client.query(
    `
    SELECT lr.certification_id, c.code, c.name
    FROM lab_requirements lr
    JOIN certifications c ON c.id = lr.certification_id
    WHERE lr.lab_id = $1
    `,
    [labId]
  );
  const required = reqRes.rows;

  const ownRes = await client.query(
    `
    SELECT uc.certification_id
    FROM user_certifications uc
    WHERE uc.user_id = $1
    `,
    [userId]
  );
  const owned = new Set(ownRes.rows.map(r => r.certification_id));

  const missing = required.filter(r => !owned.has(r.certification_id))
    .map(r => ({ id: r.certification_id, code: r.code, name: r.name }));

  return {
    missing,
    requiredIds: required.map(r => r.certification_id),
    ownedIds: Array.from(owned),
  };
}

/**
 * GET /api/approved
 * Lista solicitudes aprobadas con datos del solicitante, laboratorio y items.
 * Query params opcionales: from, to, labId
 */
async function listApproved(req, res) {
  const { from, to, labId } = req.query;
  const params = [];
  const where = [`r.status = 'APROBADA'`];

  if (from) { params.push(from); where.push(`r.requested_at >= $${params.length}`); }
  if (to)   { params.push(to);   where.push(`r.requested_at <  $${params.length}`); }
  if (labId){ params.push(labId);where.push(`r.lab_id = $${params.length}`); }

  try {
    const q = `
      SELECT r.id AS request_id, r.requested_at,
             u.full_name AS user_name, u.email AS user_email,
             l.name AS lab_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'resource_id', ri.resource_id,
                   'quantity', ri.quantity,
                   'resource_name', res.name,
                   'resource_code', res.code
                 )
               ) FILTER (WHERE ri.resource_id IS NOT NULL), '[]'::json
             ) AS items
      FROM requests r
      JOIN users u ON u.id = r.user_id
      JOIN laboratories l ON l.id = r.lab_id
      LEFT JOIN request_items ri ON ri.request_id = r.id
      LEFT JOIN resources res ON res.id = ri.resource_id
      WHERE ${where.join(' AND ')}
      GROUP BY r.id, u.full_name, u.email, l.name
      ORDER BY r.requested_at DESC
      LIMIT 500
    `;
    const { rows } = await pool.query(q, params);
    return res.json(rows);
  } catch (err) {
    console.error('listApproved error', err);
    return res.status(500).json({ error: 'Internal error listing approved requests' });
  }
}

/**
 * POST /api/approved/:requestId/validate
 * Confirma requisitos/capacitaciones previas del solicitante para el lab.
 */
async function validateBeforeDelivery(req, res) {
  const { requestId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pack = await fetchRequestWithItems(client, requestId);
    if (!pack) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }
    const { request } = pack;
    if (request.status !== 'APROBADA') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Request is not in APROBADA status' });
    }

    const check = await computeMissingCertifications(client, request.lab_id, request.user_id);
    await client.query('COMMIT');
    return res.json({ ok: check.missing.length === 0, missing: check.missing });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('validateBeforeDelivery error', err);
    return res.status(500).json({ error: 'Internal error validating requirements' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/approved/:requestId/deliver
 * Registra la entrega. Actualiza inventario (movements OUT) y estado de recursos a 'RESERVADO' (si aplica).
 */
async function createDelivery(req, res) {
  const { requestId } = req.params;
  const deliveredBy = req.user?.id; // requiere auth middleware
  if (!deliveredBy) return res.status(401).json({ error: 'Auth required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Bloquea la solicitud para evitar dobles entregas
    const pack = await fetchRequestWithItems(client, requestId);
    if (!pack) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }
    const { request, items } = pack;

    if (request.status !== 'APROBADA') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Request is not in APROBADA status' });
    }

    // ¿Ya existe entrega?
    const existing = await client.query(
      `SELECT id FROM deliveries WHERE request_id = $1 LIMIT 1`,
      [requestId]
    );
    if (existing.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Delivery already exists for this request' });
    }

    // Validación de requisitos (bloqueante)
    const check = await computeMissingCertifications(client, request.lab_id, request.user_id);
    if (check.missing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Missing certifications', missing: check.missing });
    }

    // Crea entrega
    const delRes = await client.query(
      `INSERT INTO deliveries (request_id, delivered_by)
       VALUES ($1, $2) RETURNING id, created_at`,
      [requestId, deliveredBy]
    );
    const deliveryId = delRes.rows[0].id;

    // Items de entrega (espejo de request_items)
    await client.query(
      `
      INSERT INTO delivery_items (delivery_id, resource_id, quantity)
      SELECT $1, ri.resource_id, ri.quantity
      FROM request_items ri
      WHERE ri.request_id = $2
      `,
      [deliveryId, requestId]
    );

    // Movimientos de inventario: OUT
    await client.query(
      `
      INSERT INTO inventory_movements (resource_id, movement_type, quantity, reference, note)
      SELECT ri.resource_id, 'OUT', ri.quantity, $1::uuid, 'Entrega solicitud aprobada'
      FROM request_items ri
      WHERE ri.request_id = $2
      `,
      [deliveryId, requestId]
    );

    // Actualiza estado de recursos (si existe columna status y tipo equipo)
    await client.query(
      `
      UPDATE resources r
      SET status = 'RESERVADO'
      FROM request_items ri
      WHERE ri.request_id = $1
        AND ri.resource_id = r.id
        AND (r.type = 'EQUIPO' OR r.type IS NULL)
      `,
      [requestId]
    );

    // Opcional: actualizar estado de la solicitud a 'EN_ENTREGA' (si quieres un estado intermedio)
    // await client.query(`UPDATE requests SET status = 'ENTREGADO' WHERE id = $1`, [requestId]);

    await client.query('COMMIT');
    return res.json({
      ok: true,
      delivery_id: deliveryId,
      request_id: requestId,
      items_count: items.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createDelivery error', err);
    return res.status(500).json({ error: 'Internal error creating delivery' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/approved/deliveries/:deliveryId/return
 * Registra devolución. condition: 'OK' | 'DAÑADO'
 * Actualiza inventario (movements IN) y estado de recursos (DISPONIBLE/EN_MANTENIMIENTO).
 */
async function createReturn(req, res) {
  const { deliveryId } = req.params;
  const { condition = 'OK', notes = '' } = req.body || {};
  const receivedBy = req.user?.id;
  if (!receivedBy) return res.status(401).json({ error: 'Auth required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verifica entrega
    const del = await client.query(
      `
      SELECT d.id, d.request_id, r.lab_id
      FROM deliveries d
      JOIN requests r ON r.id = d.request_id
      WHERE d.id = $1
      `,
      [deliveryId]
    );
    if (del.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Evitar doble devolución
    const existed = await client.query(
      `SELECT id FROM returns WHERE delivery_id = $1 LIMIT 1`,
      [deliveryId]
    );
    if (existed.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Return already exists for this delivery' });
    }

    // Crear devolución
    const retRes = await client.query(
      `
      INSERT INTO returns (delivery_id, received_by, condition, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
      `,
      [deliveryId, receivedBy, condition, notes]
    );
    const returnId = retRes.rows[0].id;

    // return_items espejo de delivery_items
    await client.query(
      `
      INSERT INTO return_items (return_id, resource_id, quantity)
      SELECT $1, di.resource_id, di.quantity
      FROM delivery_items di
      WHERE di.delivery_id = $2
      `,
      [returnId, deliveryId]
    );

    // Movimientos de inventario: IN
    await client.query(
      `
      INSERT INTO inventory_movements (resource_id, movement_type, quantity, reference, note)
      SELECT di.resource_id, 'IN', di.quantity, $1::uuid, 'Devolución'
      FROM delivery_items di
      WHERE di.delivery_id = $2
      `,
      [returnId, deliveryId]
    );

    // Estado de recursos según condición
    if (condition === 'OK') {
      await client.query(
        `
        UPDATE resources r
        SET status = 'DISPONIBLE'
        FROM delivery_items di
        WHERE di.delivery_id = $1 AND di.resource_id = r.id
        `,
        [deliveryId]
      );
    } else {
      // DAÑADO → EN_MANTENIMIENTO (o crear registro en mantenimiento si tienes esa tabla)
      await client.query(
        `
        UPDATE resources r
        SET status = 'EN_MANTENIMIENTO'
        FROM delivery_items di
        WHERE di.delivery_id = $1 AND di.resource_id = r.id
        `,
        [deliveryId]
      );
    }

    await client.query('COMMIT');
    return res.json({ ok: true, return_id: returnId, delivery_id: deliveryId, condition });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createReturn error', err);
    return res.status(500).json({ error: 'Internal error creating return' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/approved/:requestId/notify
 * Stub para notificaciones (retrasos/problemas). Guarda un log simple.
 * Integra aquí tu servicio de correo/FCM/webhooks cuando lo tengas.
 */
async function notifyIssues(req, res) {
  const { requestId } = req.params;
  const { type = 'RETRASO', message = '' } = req.body || {};
  const by = req.user?.id || null;

  try {

     const q = `
       INSERT INTO notifications (request_id, created_by, type, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at
     `;
     const { rows } = await pool.query(q, [requestId, by, type, message]);

    console.log('[notifyIssues]', { requestId, by, type, message });
    return res.json({ ok: true, request_id: requestId, type });
  } catch (err) {
    console.error('notifyIssues error', err);
    return res.status(500).json({ error: 'Internal error sending notification' });
  }
}

module.exports = {
  listApproved,
  validateBeforeDelivery,
  createDelivery,
  createReturn,
  notifyIssues,
};
