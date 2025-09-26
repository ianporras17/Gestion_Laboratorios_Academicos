const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const { hashPassword, comparePassword } = require('../utils/password');
const { signJwt } = require('../utils/jwt');

/** Dominios por rol */
const DOMAIN_STUDENT = '@estudiante.tec.ac.cr';
const DOMAIN_TEACHER = '@itcr.ac.cr';
const DOMAIN_TECH    = '@itcr.ac.cr';
const DOMAIN_ADMIN   = '@tec.ac.cr';

/** Helpers de rol/dominio */
const ALLOWED_ROLES = ['STUDENT','TEACHER','TECH','ADMIN'];

function normRole(role) {
  return String(role || '').trim().toUpperCase();
}

function emailMatchesRole(email, roleNorm) {
  const em = String(email || '').trim().toLowerCase();
  switch (roleNorm) {
    case 'STUDENT': return em.endsWith(DOMAIN_STUDENT);
    case 'TEACHER': return em.endsWith(DOMAIN_TEACHER);
    case 'TECH':    return em.endsWith(DOMAIN_TECH);
    case 'ADMIN':   return em.endsWith(DOMAIN_ADMIN);
    default:        return false;
  }
}

/** Mapeo al enum de BD: student/teacher en minúscula; TECH/ADMIN en mayúscula */
function toDbRole(roleNorm) {
  if (roleNorm === 'ADMIN') return 'ADMIN';
  if (roleNorm === 'TECH')  return 'TECH';
  if (roleNorm === 'TEACHER') return 'teacher';
  return 'student';
}

/* ========== Validators ========== */
const registerValidators = [
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8 }),
  body('role')
    .custom(v => ALLOWED_ROLES.includes(normRole(v)))
    .withMessage('Invalid role'),
  body('full_name').isString().notEmpty(),
  body('id_code').isString().notEmpty(),
  body('career_or_department').isString().notEmpty(),
  body('phone').optional().isString(),
];

const loginValidators = [
  body('email').isEmail(),
  body('password').isString().notEmpty()
];

/* ========== Handlers ========== */
async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { email, password, role, full_name, id_code, career_or_department, phone } = req.body;
  const roleNorm = normRole(role);

  if (!emailMatchesRole(email, roleNorm)) {
    return res.status(422).json({
      error: `Correo no autorizado para rol ${role}`,
      allowed: {
        student: DOMAIN_STUDENT,
        teacher: DOMAIN_TEACHER,
        TECH: DOMAIN_TECH,
        ADMIN: DOMAIN_ADMIN
      }
    });
  }

  const dbRole = toDbRole(roleNorm);

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
      dbRole, full_name, id_code, career_or_department, email, phone || null, password_hash
    ]);
    const user = rows[0];
    const token = signJwt({ id: user.id, role: String(user.role).toUpperCase() });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error('register', e);
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

    // Bloquea login si el correo no concuerda con el rol guardado
    if (!emailMatchesRole(user.email, normRole(user.role))) {
      return res.status(403).json({ error: 'Dominio de correo no autorizado para este rol' });
    }

    const token = signJwt({ id: user.id, role: user.role });
    delete user.password_hash;
    return res.json({ token, user });
  } catch (e) {
    console.error('login', e);
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
