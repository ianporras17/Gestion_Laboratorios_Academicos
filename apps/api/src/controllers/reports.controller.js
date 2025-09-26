// apps/api/src/controllers/reports.controller.js
const { exportReport: doExport } = require('../utils/reportExport');
const pool = require('../db/pool');

/** Rango opcional YYYY-MM-DD */
function parseRange(qs) {
  const from = qs.from ? new Date(qs.from + 'T00:00:00') : null;
  const to   = qs.to   ? new Date(qs.to   + 'T23:59:59') : null;
  return { from, to };
}

/** --------- Data helpers --------- */
async function getUsageData({ from, to }) {
  const sql = `
    SELECT
      di.resource_id,
      COALESCE(r.name, r.code::text)      AS resource_name,
      rq.user_id,
      u.email                              AS user_email,
      COUNT(*)                             AS times_used,
      MIN(d.delivered_at)                  AS first_use,
      MAX(d.delivered_at)                  AS last_use
    FROM deliveries d
    JOIN delivery_items di ON di.delivery_id = d.id
    JOIN requests rq       ON rq.id = d.request_id
    LEFT JOIN users u      ON u.id = rq.user_id
    LEFT JOIN resources r  ON r.id = di.resource_id
    WHERE d.delivered_at >= $1
      AND d.delivered_at <  $2
      AND di.resource_id IS NOT NULL
    GROUP BY di.resource_id, r.name, r.code, rq.user_id, u.email
    ORDER BY times_used DESC, last_use DESC;
  `;
  const params = [from, to];
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getInventoryData() {
  const eqSQL = `
    SELECT id, name, 'EQUIPO'::text AS type, status, location
    FROM resources
    ORDER BY name
    LIMIT 500;
  `;
  const matSQL = `
    SELECT id, name, 'MATERIAL'::text AS type, stock, low_stock_threshold
    FROM materials
    ORDER BY name
    LIMIT 500;
  `;
  const [eq, mat] = await Promise.all([pool.query(eqSQL), pool.query(matSQL)]);
  return { equipos: eq.rows, materiales: mat.rows };
}

async function getMaintenanceData({ from, to }) {
  const params = [];
  let where = '1=1';
  if (from) { params.push(from); where += ` AND (m.scheduled_at >= $${params.length} OR m.started_at >= $${params.length})`; }
  if (to)   { params.push(to);   where += ` AND (m.scheduled_at <= $${params.length} OR m.started_at <= $${params.length})`; }

  const sql = `
    SELECT
      m.id, m.resource_id, m.scheduled_at, m.started_at, m.completed_at, m.result,
      CASE WHEN m.started_at IS NOT NULL AND m.completed_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (m.completed_at - m.started_at))/3600.0
           ELSE NULL
      END AS downtime_hours
    FROM maintenances m
    WHERE ${where}
    ORDER BY COALESCE(m.started_at, m.scheduled_at) DESC
    LIMIT 500;
  `;
  const { rows } = await pool.query(sql, params);

  const sqlFreq = `
    SELECT resource_id, COUNT(*)::int AS repairs
    FROM maintenances
    GROUP BY resource_id
    ORDER BY repairs DESC
    LIMIT 50;
  `;
  const { rows: freq } = await pool.query(sqlFreq);

  return { mantenimientos: rows, frecuencia: freq };
}

/** --------- JSON endpoints (para Postman) --------- */
exports.usage = async (req, res) => {
  try {
    const { from, to } = parseRange(req.query);
    const data = await getUsageData({ from, to });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error en usage' }); }
};

exports.inventory = async (_req, res) => {
  try {
    const data = await getInventoryData();
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error en inventory' }); }
};

exports.maintenance = async (req, res) => {
  try {
    const { from, to } = parseRange(req.query);
    const data = await getMaintenanceData({ from, to });
    res.json(data);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Error en maintenance' }); }
};

/** --------- Export (PDF/XLSX) --------- */
exports.exportReport = async (req, res) => {
  try {
    const kind   = String(req.query.kind || '').toLowerCase();     // usage|inventory|maintenance
    const format = String(req.query.format || '').toLowerCase();   // pdf|xlsx
    const { from, to } = parseRange(req.query);

    if (!['usage','inventory','maintenance'].includes(kind))
      return res.status(400).json({ error: 'kind debe ser usage|inventory|maintenance' });
    if (!['pdf','xlsx'].includes(format))
      return res.status(400).json({ error: 'format debe ser pdf|xlsx' });

    let data = {};
    if (kind === 'usage')       data = await getUsageData({ from, to });
    if (kind === 'inventory')   data = await getInventoryData();
    if (kind === 'maintenance') data = await getMaintenanceData({ from, to });

    await doExport(kind, format, data, res, { from, to });
  } catch (e) {
  console.error('[EXPORT ERROR]', e?.message, e?.stack);
  if (!res.headersSent) res.status(500).json({ error: 'Error al exportar reporte' });
}

};
// controllers/reports.controller.js
