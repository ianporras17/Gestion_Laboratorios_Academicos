const { query, param, validationResult } = require('express-validator');
const pool = require('../db/pool');

/**
 * GET /search/resources
 * Query:
 * - q (texto), lab_id, type, location
 * - from, to (ISO: 2025-09-24T08:00:00Z)  -> filtra disponibilidad en ese rango
 * - limit, offset
 *
 * Filtros avanzados:
 * - Solo recursos cuyo allowed_roles incluye req.user.role
 * - y cuyas certificaciones requeridas están cumplidas por req.user.id
 * - y si from/to: que no tengan traslapes en ese rango (pending/approved)
 */
const searchValidators = [
  query('limit').optional().isInt({ min:1, max:200 }),
  query('offset').optional().isInt({ min:0 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('lab_id').optional().isUUID(),
  query('type').optional().isString(),
  query('location').optional().isString(),
  query('q').optional().isString(),
];

async function searchResources(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const {
    q, lab_id, type, location, from, to,
    limit = 20, offset = 0
  } = req.query;

  const userId = req.user.id;
  const role = req.user.role;

  const values = [];
  const where = [];

  // texto libre
  if (q) {
    values.push(`%${q}%`);
    where.push(`(r.name ILIKE $${values.length} OR r.description ILIKE $${values.length} OR l.name ILIKE $${values.length})`);
  }
  if (lab_id) { values.push(lab_id); where.push(`r.lab_id = $${values.length}`); }
  if (type)   { values.push(type);   where.push(`r.type ILIKE $${values.length}`); }
  if (location) { values.push(`%${location}%`); where.push(`l.location ILIKE $${values.length}`); }

  // rol permitido
  values.push(role);
  where.push(`$${values.length} = ANY(r.allowed_roles)`);

  // requisitos cumplidos (no debe existir requisito sin cumplir)
  values.push(userId);
  where.push(`NOT EXISTS (
      SELECT 1
        FROM resource_required_certifications rc
        LEFT JOIN user_certifications uc
               ON uc.certification_id = rc.certification_id
              AND uc.user_id = $${values.length}
       WHERE rc.resource_id = r.id
         AND uc.user_id IS NULL
    )`);

  // disponibilidad en rango (opcional)
  let availabilitySelect = 'NULL::boolean AS available';
  if (from && to) {
    values.push(from); const idxFrom = values.length;
    values.push(to);   const idxTo   = values.length;
    where.push(`NOT EXISTS (
      SELECT 1 FROM reservations rv
       WHERE rv.resource_id = r.id
         AND rv.status IN ('pending','approved')
         AND rv.start_time < $${idxTo} AND rv.end_time > $${idxFrom}
    )`);
    availabilitySelect = 'TRUE AS available';
  }

  // paginación
  values.push(limit); const idxLimit = values.length;
  values.push(offset); const idxOffset = values.length;

  const sql = `
    SELECT
      r.id, r.name, r.type, r.description, r.allowed_roles,
      l.id AS lab_id, l.name AS lab_name, l.location,
      ${availabilitySelect},
      -- requisitos que pide el recurso
      COALESCE((
        SELECT json_agg(row_to_json(x)) FROM (
          SELECT c.code, c.name
          FROM resource_required_certifications rc
          JOIN certifications c ON c.id = rc.certification_id
          WHERE rc.resource_id = r.id
          ORDER BY c.code
        ) x
      ), '[]') AS required_certifications
    FROM resources r
    JOIN labs l ON l.id = r.lab_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY l.name ASC, r.name ASC
    LIMIT $${idxLimit} OFFSET $${idxOffset}
  `;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(sql, values);
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Search failed' });
  } finally {
    client.release();
  }
}

/**
 * GET /resources/:id/policies
 * Devuelve allowed_roles, requisitos (codigos/nombres) y términos
 */
const policiesValidators = [ param('id').isUUID() ];

async function getPolicies(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT r.id, r.name, r.type, r.allowed_roles,
             l.id AS lab_id, l.name AS lab_name, l.location,
             (SELECT terms FROM resource_policies p WHERE p.resource_id = r.id) AS terms,
             (SELECT requirements_text FROM resource_policies p WHERE p.resource_id = r.id) AS requirements_text,
             COALESCE((
               SELECT json_agg(row_to_json(x)) FROM (
                 SELECT c.code, c.name
                 FROM resource_required_certifications rc
                 JOIN certifications c ON c.id = rc.certification_id
                 WHERE rc.resource_id = r.id
                 ORDER BY c.code
               ) x
             ), '[]') AS required_certifications
      FROM resources r
      JOIN labs l ON l.id = r.lab_id
      WHERE r.id = $1
    `, [id]);

    if (!rows.length) return res.status(404).json({ error: 'Resource not found' });
    return res.json(rows[0]);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to get policies' });
  } finally {
    client.release();
  }
}

/**
 * GET /resources/:id/availability
 * Query:
 * - from, to (ISO)  O  view=week|month (desde 'date' YYYY-MM-DD)
 * - interval (minutos, default 60)
 * - workdayStart (HH:mm, default 07:00)
 * - workdayEnd   (HH:mm, default 21:00)
 *
 * Devuelve slots con status 'free' | 'busy'
 */
const availabilityValidators = [
  param('id').isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('view').optional().isIn(['week','month']),
  query('date').optional().isISO8601(),
  query('interval').optional().isInt({ min: 15, max: 480 }),
  query('workdayStart').optional().matches(/^\d{2}:\d{2}$/),
  query('workdayEnd').optional().matches(/^\d{2}:\d{2}$/),
];

function parseTimeToMinutes(t) {
  const [H, M] = t.split(':').map(Number);
  return H*60 + M;
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins*60000);
}

function atTime(baseDate, hhmm) {
  const d = new Date(baseDate);
  const [H,M] = hhmm.split(':').map(Number);
  d.setHours(H, M, 0, 0);
  return d;
}

async function getAvailability(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  let { from, to, view, date, interval = 60, workdayStart = '07:00', workdayEnd = '21:00' } = req.query;

  // Derivar rango si se pide week|month
  if (!from || !to) {
    const base = date ? new Date(date) : new Date();
    if (view === 'month') {
      const first = new Date(base.getFullYear(), base.getMonth(), 1);
      const last  = new Date(base.getFullYear(), base.getMonth()+1, 0);
      from = first.toISOString();
      // fin del día 'last' a 23:59
      last.setHours(23,59,59,999);
      to = last.toISOString();
    } else {
      // por defecto: semana [lunes..domingo] que contiene 'base'
      const day = base.getDay(); // 0 dom .. 6 sab
      const diffToMonday = (day+6) % 7;
      const monday = new Date(base); monday.setDate(base.getDate()-diffToMonday);
      const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
      from = monday.toISOString();
      to   = sunday.toISOString();
    }
  }

  // Traer reservas del rango
  const client = await pool.connect();
  try {
    const { rows: resourceRows } = await client.query(`
      SELECT r.id, r.name, r.type, r.description, l.name AS lab_name, l.location
      FROM resources r JOIN labs l ON l.id = r.lab_id WHERE r.id=$1
    `, [id]);
    if (!resourceRows.length) return res.status(404).json({ error: 'Resource not found' });
    const resource = resourceRows[0];

    const { rows: bookings } = await client.query(`
      SELECT id, start_time, end_time, status
        FROM reservations
       WHERE resource_id=$1
         AND status IN ('pending','approved')
         AND start_time < $3 AND end_time > $2
       ORDER BY start_time ASC
    `, [id, from, to]);

    // Generar slots
    const slots = [];
    const intMin = parseInt(interval, 10);
    const dayStartMin = parseTimeToMinutes(workdayStart);
    const dayEndMin   = parseTimeToMinutes(workdayEnd);

    const startRange = new Date(from);
    const endRange   = new Date(to);

    for (let d = new Date(startRange); d <= endRange; d.setDate(d.getDate()+1)) {
      // por día, generar bloques dentro de la jornada
      const sDay = atTime(d, workdayStart);
      const eDay = atTime(d, workdayEnd);
      for (let t = new Date(sDay); t < eDay; t = addMinutes(t, intMin)) {
        const blockStart = new Date(t);
        const blockEnd   = addMinutes(blockStart, intMin);
        if (blockEnd > eDay) break;

        // ocupado si se traslapa con alguna reserva
        const busy = bookings.some(b =>
          new Date(b.start_time) < blockEnd && new Date(b.end_time) > blockStart
        );

        slots.push({
          start: blockStart.toISOString(),
          end: blockEnd.toISOString(),
          status: busy ? 'busy' : 'free'
        });
      }
    }

    return res.json({ resource, from, to, interval: intMin, workdayStart, workdayEnd, slots });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to compute availability' });
  } finally {
    client.release();
  }
}

module.exports = {
  searchValidators,
  searchResources,
  policiesValidators,
  getPolicies,
  availabilityValidators,
  getAvailability
};
