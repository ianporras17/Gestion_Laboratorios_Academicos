const pool = require('../db/pool');

/* Helper */
async function getResource(client, id, forUpdate = false) {
  const q = `SELECT * FROM resources WHERE id = $1` + (forUpdate ? ' FOR UPDATE' : '');
  const { rows } = await client.query(q, [id]);
  return rows[0] || null;
}

/* Listado */
async function listResources(req, res) {
  const { type, status, labId, q } = req.query;
  const where = [];
  const params = [];
  if (type)   { params.push(type);   where.push(`type = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (labId)  { params.push(labId);  where.push(`lab_id = $${params.length}`); }
  if (q)      { params.push(`%${q}%`); where.push(`(name ILIKE $${params.length} OR code ILIKE $${params.length})`); }

  const sql = `
    SELECT id, lab_id, type, name, code, status, location, stock, min_stock, created_at, updated_at
    FROM resources
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY name ASC
    LIMIT 500
  `;
  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('listResources', e);
    res.status(500).json({ error: 'Internal error listing resources' });
  }
}

/* Alta EQUIPO */
async function createEquipment(req, res) {
  const { lab_id, name, code, location } = req.body || {};
  if (!lab_id || !name || !code) return res.status(400).json({ error: 'lab_id, name, code required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO resources (lab_id, type, name, code, status, location, stock, min_stock)
       VALUES ($1, 'EQUIPO', $2, $3, 'DISPONIBLE', $4, 0, 0)
       RETURNING *`,
      [lab_id, name, code, location || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('createEquipment', e);
    res.status(500).json({ error: 'Internal error creating equipment' });
  }
}

/* Editar EQUIPO */
async function updateEquipment(req, res) {
  const { id } = req.params;
  const { lab_id, name, code, location } = req.body || {};
  const fields = [];
  const params = [];
  if (lab_id)   { params.push(lab_id);   fields.push(`lab_id = $${params.length}`); }
  if (name)     { params.push(name);     fields.push(`name = $${params.length}`); }
  if (code)     { params.push(code);     fields.push(`code = $${params.length}`); }
  if (location) { params.push(location); fields.push(`location = $${params.length}`); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  params.push(id);
  try {
    const { rows } = await pool.query(
      `UPDATE resources SET ${fields.join(', ')} WHERE id = $${params.length} AND type='EQUIPO' RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('updateEquipment', e);
    res.status(500).json({ error: 'Internal error updating equipment' });
  }
}

/* Baja EQUIPO */
async function deactivateEquipment(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE resources SET status='INACTIVO' WHERE id=$1 AND type='EQUIPO' RETURNING *`, [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ ok: true, id, status: rows[0].status });
  } catch (e) {
    console.error('deactivateEquipment', e);
    res.status(500).json({ error: 'Internal error deactivating equipment' });
  }
}

/* Alta MATERIAL (stock inicial opcional) */
async function createMaterial(req, res) {
  const { lab_id, name, code, min_stock, initial_stock } = req.body || {};
  if (!lab_id || !name || !code) return res.status(400).json({ error: 'lab_id, name, code required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO resources (lab_id, type, name, code, status, stock, min_stock)
       VALUES ($1,'MATERIAL',$2,$3,'DISPONIBLE',$4,$5)
       RETURNING *`,
      [lab_id, name, code, initial_stock || 0, min_stock || 0]
    );
    const material = rows[0];

    if ((initial_stock || 0) > 0) {
      await client.query(
        `INSERT INTO inventory_movements (resource_id, type, quantity, reason, actor_id)
         VALUES ($1, 'IN', $2, 'Alta material - stock inicial', $3)`,
        [material.id, initial_stock || 0, req.user?.id || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(material);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('createMaterial', e);
    res.status(500).json({ error: 'Internal error creating material' });
  } finally {
    client.release();
  }
}

/* Ajuste stock MATERIAL (delta >0 = IN, delta <0 = OUT) */
async function adjustMaterialStock(req, res) {
  const { id } = req.params;
  const { delta, reason } = req.body || {};
  const actorId = req.user?.id;

  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(422).json({ error: 'delta must be a non-zero number' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `SELECT id, type, COALESCE(stock,0) AS stock
       FROM resources WHERE id=$1 AND type='MATERIAL' FOR UPDATE`,
      [id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'material not found' });

    const current = Number(r.rows[0].stock);
    const next = current + delta;
    if (next < 0) return res.status(409).json({ error: 'stock cannot go negative' });

    await client.query(`UPDATE resources SET stock=$2 WHERE id=$1`, [id, next]);

    const movementType = delta < 0 ? 'OUT' : 'IN';
    await client.query(
      `INSERT INTO inventory_movements (resource_id, type, quantity, reason, actor_id)
       VALUES ($1, $2, ABS($3), $4, $5)`,
      [id, movementType, delta, reason || null, actorId]
    );

    await client.query('COMMIT');
    res.json({ ok: true, stock: next });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('adjustMaterialStock', e);
    res.status(500).json({ error: 'Internal error adjusting stock' });
  } finally {
    client.release();
  }
}

/* Cambiar estado recurso */
async function setResourceStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['DISPONIBLE','RESERVADO','EN_MANTENIMIENTO','INACTIVO'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { rows } = await pool.query(
      `UPDATE resources SET status=$1 WHERE id=$2 RETURNING id, status`, [status, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Resource not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('setResourceStatus', e);
    res.status(500).json({ error: 'Internal error setting status' });
  }
}

/* Movimientos manuales (IN/OUT) – actualiza stock si es MATERIAL */
async function createMovement(req, res) {
  const { resource_id, movement_type, quantity, reason } = req.body || {};
  const actorId = req.user?.id;

  if (!resource_id || !movement_type || !Number.isFinite(quantity) || quantity <= 0) {
    return res.status(422).json({ error: 'resource_id, movement_type(IN|OUT), quantity>0 required' });
  }
  const type = String(movement_type).toUpperCase();
  if (!['IN', 'OUT'].includes(type)) {
    return res.status(422).json({ error: 'movement_type must be IN or OUT' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `SELECT id, type, COALESCE(stock,0) AS stock
       FROM resources WHERE id=$1 FOR UPDATE`,
      [resource_id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'resource not found' });

    const isMaterial = r.rows[0].type === 'MATERIAL';
    let nextStock = Number(r.rows[0].stock);

    if (isMaterial) {
      nextStock = type === 'IN' ? nextStock + quantity : nextStock - quantity;
      if (nextStock < 0) return res.status(409).json({ error: 'stock cannot go negative' });
      await client.query(`UPDATE resources SET stock=$2 WHERE id=$1`, [resource_id, nextStock]);
    }

    await client.query(
      `INSERT INTO inventory_movements (resource_id, type, quantity, reason, actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [resource_id, type, quantity, reason || null, actorId]
    );

    await client.query('COMMIT');
    res.json({ ok: true, newStock: isMaterial ? nextStock : undefined });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('createMovement', e);
    res.status(500).json({ error: 'Internal error creating movement' });
  } finally {
    client.release();
  }
}

module.exports = {
  listResources,
  createEquipment,
  updateEquipment,
  deactivateEquipment,
  createMaterial,
  adjustMaterialStock,
  setResourceStatus,
  createMovement,
  listLowStock: async function listLowStock(req, res) {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, code, stock, min_stock, lab_id
         FROM resources
         WHERE type='MATERIAL' AND stock < min_stock
         ORDER BY (min_stock - stock) DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error('listLowStock', e);
      res.status(500).json({ error: 'Internal error listing low stock' });
    }
  }
};
