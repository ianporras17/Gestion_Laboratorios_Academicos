// apps/api/src/db/pool.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // si usas PG remoto con SSL
});

pool.on('error', (err) => {
  console.error('PG Pool error', err);
  process.exit(1);
});

module.exports = pool;
