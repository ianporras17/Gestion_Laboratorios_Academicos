const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { hashPassword, comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

const DOMAIN_STUDENT = '@estudiantec.cr';  // ajusta si usas variantes
const DOMAIN_TEACHER = '@itcr.ac.cr';

function isValidByRole(email, role) {
  const em = String(email || '').toLowerCase();
  if (role === 'student') return em.endsWith(DOMAIN_STUDENT);
  if (role === 'teacher') return em.endsWith(DOMAIN_TEACHER);
  return false;
}

// Validators
const registerValidators = [
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('role').isIn(['student', 'teacher']),
  body('full_name').isString().notEmpty(),
  body('id_code').isString().notEmpty(),
  body('career_or_department').isString().notEmpty(),
  body('phone').optional().isString(),
];

const loginValidators = [
  body('email').isEmail(),
  body('password').isString().notEmpty()
];

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password, role, full_name, id_code, career_or_department, phone } = req.body;

  if (!isValidByRole(email, role)) {
    return res.status(422).json({ error: `Email domain does not match role ${role}` });
  }

  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await hashPassword(password);
    const insert = `
      INSERT INTO users (role, full_name, id_code, career_or_department, email, phone, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, role, full_name, id_code, career_or_department, email, phone, created_at, updated_at
    `;
    const { rows } = await client.query(insert, [
      role, full_name, id_code, career_or_department, email, phone || null, password_hash
    ]);
    const user = rows[0];
    const token = signJwt({ id: user.id, role: user.role });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Register failed' });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password } = req.body;
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signJwt({ id: user.id, role: user.role });
    // Limpia campos sensibles
    delete user.password_hash;
    return res.json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Login failed' });
  } finally {
    client.release();
  }
}

module.exports = {
  registerValidators,
  loginValidators,
  register,
  login
};
