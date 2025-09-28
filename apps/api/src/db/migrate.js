const fs = require('fs');
const path = require('path');
const pool = require('./pool');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log('> Running', f);
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('Migrations OK');
    process.exit(0);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
  }
})();
