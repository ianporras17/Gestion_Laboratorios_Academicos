const pool = require('../db/pool');

/* Helper: obtiene recurso por id con lock opcional */
async function getResource(client, id, forUpdate = false) {
  const q = `SELECT * FROM resources WHERE id = $1` + (forUpdate ? ' FOR UPDATE' : '');
  const { rows } = await client.query(q, [id]);
  return rows[0] || null;
}

/* Listado con filtros: type, status, labId, q (name/code) */
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

/* Alta de EQUIPO */
async function createEquipment(req, res) {
  const { lab_id, name, code, location } = req.body || {};
  if (!lab_id || !name || !code) return res.status(400).json({ error: 'lab_id, name, code required' });

  try {
    const sql = `
      INSERT INTO resources (lab_id, type, name, code, status, location, stock, min_stock)
      VALUES ($1, 'EQUIPO', $2, $3, 'DISPONIBLE', $4, 0, 0)
      RETURNING *
    `;
    const { rows } = await pool.query(sql, [lab_id, name, code, location || null]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('createEquipment', e);
    res.status(500).json({ error: 'Internal error creating equipment' });
  }
}

/* Editar EQUIPO (nombre, código, ubicación, lab, etc.) */
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
  const sql = `UPDATE resources SET ${fields.join(', ')} WHERE id = $${params.length} AND type='EQUIPO' RETURNING *`;
  try {
    const { rows } = await pool.query(sql, params);
    if (!rows[0]) return res.status(404).json({ error: 'Equipment not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('updateEquipment', e);
    res.status(500).json({ error: 'Internal error updating equipment' });
  }
}

/* Baja (INACTIVO) de EQUIPO */
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

/* Alta de MATERIAL */
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
        `INSERT INTO inventory_movements (resource_id, user_id, movement_type, quantity, reason)
         VALUES ($1, $2, 'IN', $3, 'Alta material - stock inicial')`,
        [material.id, req.user?.id || null, initial_stock || 0]
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

/* Ajuste de stock MATERIAL con movimiento (IN/OUT) */
async function adjustMaterialStock(req, res) {
  const { id } = req.params;
  const { delta, reason } = req.body || {}; // delta >0 = IN, delta <0 = OUT
  if (!delta || delta === 0) return res.status(400).json({ error: 'delta (non-zero) required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resrc = await getResource(client, id, true);
    if (!resrc || resrc.type !== 'MATERIAL') {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Material not found' });
    }

    const newStock = resrc.stock + delta;
    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Stock cannot be negative' });
    }

    await client.query(`UPDATE resources SET stock=$1 WHERE id=$2`, [newStock, id]);
    await client.query(
      `INSERT INTO inventory_movements (resource_id, user_id, movement_type, quantity, reason)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, req.user?.id || null, delta > 0 ? 'IN' : 'OUT', Math.abs(delta), reason || null]
    );

    // Alerta simple (solo informativa)
    const low = newStock < resrc.min_stock;
    await client.query('COMMIT');
    res.json({ ok: true, resource_id: id, stock: newStock, low_stock: low });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('adjustMaterialStock', e);
    res.status(500).json({ error: 'Internal error adjusting stock' });
  } finally {
    client.release();
  }
}

/* Cambiar estado de un recurso (cubre EQUIPO y MATERIAL) */
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

/* Movimientos manuales (afecta stock solo si es MATERIAL) */
async function createMovement(req, res) {
  const { resource_id, movement_type, quantity, reason } = req.body || {};
  if (!resource_id || !movement_type || !quantity) {
    return res.status(400).json({ error: 'resource_id, movement_type, quantity required' });
  }
  if (!['IN','OUT'].includes(movement_type)) return res.status(400).json({ error: 'movement_type must be IN or OUT' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await getResource(client, resource_id, true);
    if (!r) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Resource not found' }); }

    if (r.type === 'MATERIAL') {
      const delta = movement_type === 'IN' ? quantity : -quantity;
      const newStock = r.stock + delta;
      if (newStock < 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Stock cannot be negative' });
      }
      await client.query(`UPDATE resources SET stock=$1 WHERE id=$2`, [newStock, resource_id]);
    }

    await client.query(
      `INSERT INTO inventory_movements (resource_id, user_id, movement_type, quantity, reason)
       VALUES ($1,$2,$3,$4,$5)`,
      [resource_id, req.user?.id || null, movement_type, quantity, reason || null]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('createMovement', e);
    res.status(500).json({ error: 'Internal error creating movement' });
  } finally {
    client.release();
  }
}

/* Materiales por debajo de min_stock */
async function listLowStock(req, res) {
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

module.exports = {
  listResources,
  createEquipment,
  updateEquipment,
  deactivateEquipment,
  createMaterial,
  adjustMaterialStock,
  setResourceStatus,
  createMovement,
  listLowStock,
};
