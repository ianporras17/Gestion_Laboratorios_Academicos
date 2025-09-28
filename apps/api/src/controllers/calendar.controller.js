const pool = require('../db/pool');

function esc(s='') { return String(s).replace(/[,;\\]/g, '\\$&'); }
function dtstamp(d) {
  const pad = n => String(n).padStart(2,'0');
  return d.getUTCFullYear()
    + pad(d.getUTCMonth()+1)
    + pad(d.getUTCDate()) + 'T'
    + pad(d.getUTCHours())
    + pad(d.getUTCMinutes())
    + pad(d.getUTCSeconds()) + 'Z';
}
function eventICS({ id, title, start, end, location, desc }) {
  return [
    'BEGIN:VEVENT',
    `UID:${id}@labtec`,
    `DTSTAMP:${dtstamp(new Date())}`,
    `DTSTART:${dtstamp(new Date(start))}`,
    `DTEND:${dtstamp(new Date(end))}`,
    `SUMMARY:${esc(title)}`,
    location ? `LOCATION:${esc(location)}` : null,
    desc ? `DESCRIPTION:${esc(desc)}` : null,
    'END:VEVENT'
  ].filter(Boolean).join('\r\n');
}
function wrapICS(events) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LabTec//Calendar//ES',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

// General: todas las approved
async function generalICS(_req, res) {
  const client = await pool.connect();
  try {
    const q = await client.query(`
      SELECT rv.id, rv.start_time, rv.end_time,
             r.name AS resource_name, l.name AS lab_name, l.location
      FROM reservations rv
      JOIN resources r ON r.id = rv.resource_id
      JOIN labs l ON l.id = r.lab_id
      WHERE rv.status='approved'
      ORDER BY rv.start_time ASC
      LIMIT 2000
    `);
    const events = q.rows.map(row => eventICS({
      id: row.id,
      title: `${row.lab_name} — ${row.resource_name}`,
      start: row.start_time,
      end: row.end_time,
      location: row.location,
      desc: 'Reserva aprobada'
    }));
    res.setHeader('Content-Type','text/calendar; charset=utf-8');
    return res.send(wrapICS(events));
  } finally { client.release(); }
}

// Por laboratorio
async function labICS(req, res) {
  const { labId } = req.params;
  const client = await pool.connect();
  try {
    const q = await client.query(`
      SELECT rv.id, rv.start_time, rv.end_time,
             r.name AS resource_name, l.name AS lab_name, l.location
      FROM reservations rv
      JOIN resources r ON r.id = rv.resource_id
      JOIN labs l ON l.id = r.lab_id
      WHERE rv.status='approved' AND l.id=$1
      ORDER BY rv.start_time ASC
      LIMIT 2000
    `, [labId]);
    const events = q.rows.map(row => eventICS({
      id: row.id,
      title: `${row.lab_name} — ${row.resource_name}`,
      start: row.start_time, end: row.end_time,
      location: row.location, desc: 'Reserva aprobada'
    }));
    res.setHeader('Content-Type','text/calendar; charset=utf-8');
    return res.send(wrapICS(events));
  } finally { client.release(); }
}

module.exports = { generalICS, labICS };
