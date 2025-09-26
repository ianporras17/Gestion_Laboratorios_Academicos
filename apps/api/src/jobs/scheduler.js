const pool = require('../db/pool');

const POLL_MS = 60_000; // cada minuto
const STAGES = [
  { label: 't-24h', aheadMin: 24 * 60 },
  { label: 't-1h',  aheadMin: 60 }
];

async function notifyOnce(user_id, type, title, message, data) {
  const json = JSON.stringify(data);
  const exists = await pool.query(
    `SELECT 1 FROM user_notifications
      WHERE user_id=$1 AND type=$2
        AND data->>'stage' = $3
        AND COALESCE(data->>'reservation_id','') = COALESCE($4,'')
        AND COALESCE(data->>'loan_id','') = COALESCE($5,'')
     LIMIT 1`,
    [user_id, type, data.stage, data.reservation_id || null, data.loan_id || null]
  );
  if (exists.rowCount) return;

  await pool.query(
    `INSERT INTO user_notifications (user_id, type, title, message, data)
     VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [user_id, type, title, message, json]
  );
}

async function checkReservations() {
  for (const s of STAGES) {
    await pool.query(`/* no-op just to ensure connection */ SELECT 1`);
    const q = await pool.query(
      `SELECT rv.id AS reservation_id, rv.user_id, rv.start_time,
              r.name AS resource_name, la.name AS lab_name
       FROM reservations rv
       JOIN resources r ON r.id = rv.resource_id
       JOIN labs la ON la.id = r.lab_id
       WHERE rv.status = 'approved'
         AND rv.start_time BETWEEN (now() + ($1 || ' minutes')::interval - interval '1 minute')
                               AND (now() + ($1 || ' minutes')::interval + interval '1 minute')`,
      [s.aheadMin]
    );
    for (const row of q.rows) {
      const when = new Date(row.start_time).toLocaleString('es-CR');
      await notifyOnce(
        row.user_id,
        'reservation_alert',
        `Tu reserva inicia ${s.label === 't-24h' ? 'mañana' : 'en 1 hora'}`,
        `${row.resource_name} — ${row.lab_name} (${when})`,
        { stage: s.label, reservation_id: row.reservation_id }
      );
    }
  }
}

async function checkLoans() {
  for (const s of STAGES) {
    const q = await pool.query(
      `SELECT ln.id AS loan_id, ln.user_id, ln.end_time,
              r.name AS resource_name, la.name AS lab_name
       FROM loans ln
       JOIN resources r ON r.id = ln.resource_id
       JOIN labs la ON la.id = r.lab_id
       WHERE ln.status IN ('approved','picked_up')
         AND ln.end_time BETWEEN (now() + ($1 || ' minutes')::interval - interval '1 minute')
                            AND (now() + ($1 || ' minutes')::interval + interval '1 minute')`,
      [s.aheadMin]
    );
    for (const row of q.rows) {
      const when = new Date(row.end_time).toLocaleString('es-CR');
      await notifyOnce(
        row.user_id,
        'loan_alert',
        `Devolución ${s.label === 't-24h' ? 'mañana' : 'en 1 hora'}`,
        `${row.resource_name} — ${row.lab_name} (${when})`,
        { stage: s.label, loan_id: row.loan_id }
      );
    }
  }

  // Overdue (cada minuto). Sólo si no existe notificación previa 'overdue'
  const od = await pool.query(
    `SELECT ln.id AS loan_id, ln.user_id, ln.end_time,
            r.name AS resource_name, la.name AS lab_name
     FROM loans ln
     JOIN resources r ON r.id = ln.resource_id
     JOIN labs la ON la.id = r.lab_id
     WHERE ln.status IN ('approved','picked_up') AND ln.end_time < now()`
  );
  for (const row of od.rows) {
    await notifyOnce(
      row.user_id,
      'loan_alert',
      'Préstamo vencido',
      `${row.resource_name} — ${row.lab_name}`,
      { stage: 'overdue', loan_id: row.loan_id }
    );
  }
}

let timer = null;
function start() {
  if (timer) return;
  const run = async () => {
    try {
      await checkReservations();
      await checkLoans();
    } catch (e) {
      console.error('[scheduler]', e);
    }
  };
  run(); // primer barrido inmediato
  timer = setInterval(run, POLL_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };
