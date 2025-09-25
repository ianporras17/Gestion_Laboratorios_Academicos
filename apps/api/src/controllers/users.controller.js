const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

// GET /users/me
async function getMe(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, role, full_name, id_code, career_or_department, email, phone, created_at, updated_at
       FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];

    // Traer certificaciones
    const { rows: certs } = await client.query(
      `SELECT c.code, c.name, uc.obtained_at
         FROM user_certifications uc
         JOIN certifications c ON c.id = uc.certification_id
        WHERE uc.user_id=$1
        ORDER BY uc.obtained_at DESC, c.code ASC`,
      [req.user.id]
    );

    return res.json({ user, certifications: certs });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    client.release();
  }
}

// PUT /users/me
const updateValidators = [
  body('full_name').optional().isString().notEmpty(),
  body('phone').optional().isString().notEmpty(),
  body('career_or_department').optional().isString().notEmpty(),
];

async function updateMe(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { full_name, phone, career_or_department } = req.body;
  const client = await pool.connect();
  try {
    const fields = [];
    const values = [];
    let i = 1;

    if (full_name !== undefined) { fields.push(`full_name=$${i++}`); values.push(full_name); }
    if (phone !== undefined) { fields.push(`phone=$${i++}`); values.push(phone); }
    if (career_or_department !== undefined) { fields.push(`career_or_department=$${i++}`); values.push(career_or_department); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.user.id);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=$${i} RETURNING id, role, full_name, id_code, career_or_department, email, phone, created_at, updated_at`;
    const { rows } = await client.query(sql, values);
    return res.json({ user: rows[0] });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to update profile' });
  } finally {
    client.release();
  }
}

// GET /users/me/certifications
async function getMyCerts(req, res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT c.code, c.name, uc.obtained_at
         FROM user_certifications uc
         JOIN certifications c ON c.id = uc.certification_id
        WHERE uc.user_id=$1
        ORDER BY uc.obtained_at DESC, c.code ASC`,
      [req.user.id]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to fetch certifications' });
  } finally {
    client.release();
  }
}

// POST /users/me/certifications
const certValidators = [
  body('code').isString().notEmpty(),
  body('name').optional().isString().notEmpty(),
  body('obtained_at').isISO8601()
];

async function addMyCert(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { code, name, obtained_at } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // upsert certification
    const upsertCert = `
      INSERT INTO certifications (code, name)
      VALUES ($1, COALESCE($2, $1))
      ON CONFLICT (code) DO UPDATE SET name = COALESCE(EXCLUDED.name, certifications.name)
      RETURNING id, code, name`;
    const { rows: certRows } = await client.query(upsertCert, [code, name || null]);
    const certId = certRows[0].id;

    // link to user
    const link = `
      INSERT INTO user_certifications (user_id, certification_id, obtained_at)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, certification_id) DO UPDATE SET obtained_at = EXCLUDED.obtained_at
      RETURNING user_id, certification_id, obtained_at`;
    const { rows: linkRows } = await client.query(link, [req.user.id, certId, obtained_at]);

    await client.query('COMMIT');
    return res.status(201).json(linkRows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    return res.status(500).json({ error: 'Failed to add certification' });
  } finally {
    client.release();
  }
}

module.exports = {
  getMe,
  updateValidators,
  updateMe,
  getMyCerts,
  certValidators,
  addMyCert
};
