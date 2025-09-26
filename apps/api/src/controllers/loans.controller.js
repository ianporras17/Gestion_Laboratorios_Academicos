const { body, param, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../db/pool');

// --------- Upload (opcional) ----------
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${ts}-${safe}`);
  }
});
const upload = multer({ storage });
const maybeUpload = (req, res, next) =>
  req.is('multipart/form-data') ? upload.array('files', 5)(req, res, next) : next();

// --------- Validadores ----------
const createValidators = [
  body('resource_id').isUUID(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  body('reason').optional().isString().isLength({ max: 1000 })
];

const idParam = [ param('id').isUUID() ];

// --------- Helpers ----------
async function userMeetsRequirements(client, userId, resourceId, role) {
  const r = await client.query(`SELECT allowed_roles FROM resources WHERE id=$1`, [resourceId]);
  if (!r.rowCount) return { ok:false, message:'Resource not found' };
  const allowed = r.rows[0].allowed_roles || [];
  if (!allowed.includes(role)) return { ok:false, message:'Role not allowed for this resource' };

  const miss = await client.query(`
    SELECT c.code
    FROM resource_required_certifications rc
    JOIN certifications c ON c.id = rc.certification_id
    LEFT JOIN user_certifications uc
      ON uc.certification_id = rc.certification_id AND uc.user_id = $1
    WHERE rc.resource_id = $2 AND uc.user_id IS NULL
  `, [userId, resourceId]);

  if (miss.rowCount) return { ok:false, message:'Missing required certifications', missing: miss.rows.map(x=>x.code) };
  return { ok:true };
}

async function hasOverlap(client, resourceId, start, end) {
  // Traslape con otros PRÉSTAMOS activos
  const loan = await client.query(`
    SELECT 1 FROM loans
     WHERE resource_id=$1
       AND status IN ('requested','approved','picked_up')
       AND start_time < $3 AND end_time > $2
     LIMIT 1
  `, [resourceId, start, end]);

  if (loan.rowCount) return true;

  // Traslape con RESERVAS que bloquean el equipo (por si el equipo también se reserva en sitio)
  const resv = await client.query(`
    SELECT 1 FROM reservations
     WHERE resource_id=$1
       AND status IN ('in_review','pending','approved')
       AND start_time < $3 AND end_time > $2
     LIMIT 1
  `, [resourceId, start, end]);

  return resv.rowCount > 0;
}

// --------- Endpoints ----------
async function createLoan(req, res) {
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

    const reqs = await userMeetsRequirements(client, userId, resource_id, role);
    if (!reqs.ok) { await client.query('ROLLBACK'); return res.status(422).json({ error: reqs.message, missing: reqs.missing || [] }); }

    if (await hasOverlap(client, resource_id, start, end)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Time range overlaps with an existing reservation/loan' });
    }

    const ins = await client.query(`
      INSERT INTO loans(resource_id, user_id, start_time, end_time, status, reason)
      VALUES ($1,$2,$3,$4,'requested',$5)
      RETURNING id, resource_id, user_id, start_time, end_time, status, reason, created_at
    `, [resource_id, userId, start, end, reason || null]);
    const loan = ins.rows[0];

    // Adjuntos (si vienen)
    if (Array.isArray(req.files) && req.files.length > 0) {
      const values = [];
      const params = [loan.id];
      req.files.forEach((f, i) => {
        values.push(`($1,$${i*4+2},$${i*4+3},$${i*4+4},$${i*4+5})`);
        params.push(f.path, f.originalname, f.mimetype, f.size);
      });
      await client.query(`
        INSERT INTO loan_attachments(loan_id, file_path, original_name, mime_type, size_bytes)
        VALUES ${values.join(',')}
      `, params);
    }

    // Log de actividad (para 3.4)
    const labQ = await client.query(`SELECT lab_id FROM resources WHERE id=$1`, [resource_id]);
    await client.query(`
      INSERT INTO user_activity_log(user_id, activity_type, event_time, lab_id, resource_id, loan_id, meta)
      VALUES ($1,'loan_created', now(), $2, $3, $4, $5)
    `, [userId, labQ.rows[0]?.lab_id || null, resource_id, loan.id, reason ? { reason } : null]);

    await client.query('COMMIT');
    return res.status(201).json({ loan });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[createLoan]', e);
    return res.status(500).json({ error: 'Failed to create loan' });
  } finally {
    client.release();
  }
}

async function listMyLoans(req, res) {
  const userId = req.user.id;
  const { limit = 50, offset = 0 } = req.query;
  try {
    const q = await pool.query(`
      SELECT l.id, l.status, l.start_time, l.end_time, l.reason, l.created_at,
             r.id AS resource_id, r.name AS resource_name, r.type,
             la.id AS lab_id, la.name AS lab_name, la.location,
             COALESCE((
               SELECT json_agg(row_to_json(x)) FROM (
                 SELECT id, original_name, mime_type, size_bytes, file_path
                 FROM loan_attachments WHERE loan_id=l.id ORDER BY uploaded_at ASC
               ) x
             ), '[]') AS attachments
      FROM loans l
      JOIN resources r ON r.id = l.resource_id
      JOIN labs la ON la.id = r.lab_id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    return res.json(q.rows);
  } catch (e) {
    console.error('[listMyLoans]', e);
    return res.status(500).json({ error: 'Failed to list loans' });
  }
}

async function getLoan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const userId = req.user.id;
  try {
    const q = await pool.query(`
      SELECT l.*, r.name AS resource_name, la.name AS lab_name, la.location
      FROM loans l
      JOIN resources r ON r.id = l.resource_id
      JOIN labs la ON la.id = r.lab_id
      WHERE l.id=$1
    `, [id]);

    if (!q.rowCount) return res.status(404).json({ error:'Loan not found' });
    if (q.rows[0].user_id !== userId) return res.status(403).json({ error:'Forbidden' });
    return res.json(q.rows[0]);
  } catch (e) {
    console.error('[getLoan]', e);
    return res.status(500).json({ error: 'Failed to get loan' });
  }
}

async function cancelLoan(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query(`SELECT status, start_time, resource_id FROM loans WHERE id=$1 AND user_id=$2 FOR UPDATE`, [id, userId]);
    if (!cur.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error:'Loan not found' }); }

    const { status, start_time, resource_id } = cur.rows[0];
    const now = new Date();
    const notStarted = new Date(start_time) > now;

    if (!['requested','approved'].includes(status)) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: `Cannot cancel in current status (${status})` });
    }
    if (status === 'approved' && !notStarted) {
      await client.query('ROLLBACK');
      return res.status(422).json({ error: 'Cannot cancel an approved loan that already started' });
    }

    await client.query(`UPDATE loans SET status='cancelled' WHERE id=$1`, [id]);

    // log
    const labQ = await client.query(`SELECT lab_id FROM resources WHERE id=$1`, [resource_id]);
    await client.query(`
    INSERT INTO user_activity_log(user_id, activity_type, event_time, lab_id, resource_id, loan_id)
    VALUES ($1,'loan_cancelled', now(), $2, $3, $4)  
    `, [userId, labQ.rows[0]?.lab_id || null, resource_id, id]);

    await client.query('COMMIT');
    return res.json({ ok:true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[cancelLoan]', e);
    return res.status(500).json({ error: 'Failed to cancel loan' });
  } finally {
    client.release();
  }
}

module.exports = {
  maybeUpload,
  createValidators,
  idParam,
  createLoan,
  listMyLoans,
  getLoan,
  cancelLoan
};
