const pool = require('../db/pool');

/**
 * POST /api/maintenance/schedule
 */
exports.schedule = async (req, res, next) => {
  const { resourceId, labId, type, scheduledAt, technicianId, notes } = req.body;
  const userId = req.user?.id;
  try {
    const q = `
      INSERT INTO maintenances (resource_id, lab_id, type, scheduled_at, technician_id, notes, created_by)
      VALUES ($1::uuid, $2::uuid, $3::maint_type_enum, $4::timestamptz, $5::uuid, $6::text, $7::uuid)
      RETURNING *;
    `;
    const params = [
      resourceId,
      labId,
      type,               // PREVENTIVO|CORRECTIVO
      scheduledAt || null,
      technicianId || null,
      notes || null,
      userId
    ];
    const { rows } = await pool.query(q, params);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
};

/**
 * PATCH /api/maintenance/:id/start
 * - Marca el recurso EN_MANTENIMIENTO
 * - Sella performed_at (opcional)
 * - Inserta movimiento OUT
 */
exports.start = async (req, res, next) => {
  const { id } = req.params;
  const { performedAt } = req.body || {};
  const userId = req.user?.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // set recurso EN_MANTENIMIENTO
    const updRes = await client.query(
      `
      UPDATE resources
      SET status = 'EN_MANTENIMIENTO'
      WHERE id = (SELECT resource_id FROM maintenances WHERE id = $1::uuid)
      RETURNING id
      `,
      [id]
    );
    if (updRes.rowCount === 0) throw new Error('Maintenance not found');

    // sella performed_at si viene
    if (performedAt) {
      await client.query(
        `UPDATE maintenances SET performed_at = $2::timestamptz WHERE id = $1::uuid`,
        [id, performedAt]
      );
    }

    // movimiento OUT
    await client.query(
      `
      INSERT INTO inventory_movements (resource_id, type, reason, actor_id)
      SELECT resource_id, 'MAINTENANCE_OUT', 'Salida a mantenimiento', $2::uuid
      FROM maintenances WHERE id = $1::uuid
      `,
      [id, userId]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/maintenance/:id/complete
 * - Actualiza result, used_materials, notes, performed_at
 * - Cambia estado del recurso (DISPONIBLE/INACTIVO)
 * - Inserta movimiento IN
 */
exports.complete = async (req, res, next) => {
  const { id } = req.params;
  const { result, usedMaterials, notes, performedAt } = req.body;
  const userId = req.user?.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // actualizar maintenance con tipos explícitos
    const { rows } = await client.query(
      `
      UPDATE maintenances
      SET
        result         = $2::maint_result_enum,
        used_materials = COALESCE($3::jsonb, '[]'::jsonb),
        notes = CASE
                  WHEN $4::text IS NULL OR $4::text = '' THEN notes
                  WHEN notes IS NULL OR notes = '' THEN $4::text
                  ELSE notes || E'\n' || $4::text
                END,
        performed_at   = COALESCE($5::timestamptz, performed_at)
      WHERE id = $1::uuid
      RETURNING resource_id, performed_at
      `,
      [
        id,
        result,                               // OK | INACTIVAR | OBSERVACION
        JSON.stringify(usedMaterials || []),  // jsonb
        notes || null,
        performedAt || null
      ]
    );

    if (rows.length === 0) throw new Error('Maintenance not found');

    const resourceId = rows[0].resource_id;
    const perfAt = rows[0].performed_at;

    // estado post-mantenimiento
    let newStatus = 'DISPONIBLE';
    if (result === 'INACTIVAR') newStatus = 'INACTIVO';

    await client.query(
      `
      UPDATE resources
      SET status = $2::resource_status_enum,
          last_maintenance_at = COALESCE($3::timestamptz, NOW())
      WHERE id = $1::uuid
      `,
      [resourceId, newStatus, perfAt]
    );

    // movimiento IN
    await client.query(
      `
      INSERT INTO inventory_movements (resource_id, type, reason, actor_id)
      VALUES ($1::uuid, 'MAINTENANCE_IN', 'Ingreso post-mantenimiento', $2::uuid)
      `,
      [resourceId, userId]
    );

    // TODO: notificación cuando el recurso pase a DISPONIBLE

    await client.query('COMMIT');
    res.json({ ok: true, resourceStatus: newStatus });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
};

/**
 * GET /api/maintenance?resourceId=&labId=&from=&to=
 */
exports.list = async (req, res, next) => {
  const { resourceId, labId, from, to } = req.query;
  const where = [];
  const params = [];

  if (resourceId) { params.push(resourceId); where.push(`m.resource_id = $${params.length}::uuid`); }
  if (labId)      { params.push(labId);      where.push(`m.lab_id = $${params.length}::uuid`); }
  if (from)       { params.push(from);       where.push(`(m.scheduled_at >= $${params.length}::timestamptz OR m.performed_at >= $${params.length}::timestamptz)`); }
  if (to)         { params.push(to);         where.push(`(m.scheduled_at <= $${params.length}::timestamptz OR m.performed_at <= $${params.length}::timestamptz)`); }

  const sql = `
    SELECT m.*, r.name AS resource_name, r.code AS resource_code, l.name AS lab_name
    FROM maintenances m
    JOIN resources r     ON r.id = m.resource_id
    JOIN laboratories l  ON l.id = m.lab_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(m.performed_at, m.scheduled_at) DESC NULLS LAST
    LIMIT 200
  `;

  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
};

/**
 * GET /api/maintenance/:id
 */
exports.getById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `
      SELECT m.*, r.name AS resource_name, r.code AS resource_code, l.name AS lab_name
      FROM maintenances m
      JOIN resources r    ON r.id = m.resource_id
      JOIN laboratories l ON l.id = m.lab_id
      WHERE m.id = $1::uuid
      `,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
};
