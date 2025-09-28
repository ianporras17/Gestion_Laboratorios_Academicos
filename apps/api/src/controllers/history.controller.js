const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../db/pool');

// ---------- util ----------
const fmt = (d) => new Date(d).toISOString().replace('T',' ').slice(0,16);

// ---------- consulta reutilizable ----------
async function fetchHistoryRows(userId, { from, to, type='all', limit=10000, offset=0 }) {
  const types = {
    all: null,
    reservations: ['reservation_created','reservation_status_changed','reservation_approved','reservation_cancelled'],
    loans: ['loan_created','loan_returned'],
    training: ['training_completed']
  };
  const typeFilter = types[type] || null;

  const params = [userId];
  let where = 'WHERE l.user_id = $1';
  if (typeFilter) { params.push(typeFilter); where += ` AND l.activity_type = ANY($${params.length})`; }
  if (from) { params.push(new Date(from)); where += ` AND l.event_time >= $${params.length}`; }
  if (to)   { params.push(new Date(to));   where += ` AND l.event_time <= $${params.length}`; }

  params.push(Number(limit), Number(offset));

  const q = await pool.query(`
  SELECT l.id,
         l.activity_type,
         l.event_time,
         l.hours::float8   AS hours,     -- 👈 fuerza Number
         l.credits::float8 AS credits,   -- 👈 fuerza Number
         l.meta,
         l.reservation_id,
         l.loan_id,
         l.certification_id,
         la.id   AS lab_id,
         la.name AS lab_name,
         la.location,
         r.id    AS resource_id,
         r.name  AS resource_name,
         r.type  AS resource_type
  FROM user_activity_log l
  LEFT JOIN resources r ON r.id = l.resource_id
  LEFT JOIN labs la ON la.id = l.lab_id
  ${where}
  ORDER BY l.event_time DESC
  LIMIT $${params.length - 1} OFFSET $${params.length}
`, params);

  return q.rows;
}

// ---------- controladores ----------
async function myHistory(req, res) {
  try {
    const userId = req.user.id;
    const { from, to, type='all', limit=200, offset=0 } = req.query;
    const rows = await fetchHistoryRows(userId, { from, to, type, limit, offset });
    return res.json(rows);
  } catch (e) {
    console.error('[myHistory]', e);
    return res.status(500).json({ error: 'Failed to load history' });
  }
}

async function mySummary(req, res) {
  const userId = req.user.id;
  const { from, to } = req.query;
  const params = [userId];
  let where = 'WHERE user_id=$1 AND activity_type = ANY(ARRAY[\'reservation_approved\'])';
  if (from) { params.push(new Date(from)); where += ` AND event_time >= $${params.length}`; }
  if (to)   { params.push(new Date(to));   where += ` AND event_time <= $${params.length}`; }

  try {
    const total = await pool.query(`
      SELECT COALESCE(SUM(hours),0)::float AS hours,
             COALESCE(SUM(credits),0)::float AS credits
      FROM user_activity_log
      ${where}
    `, params);

    const byLab = await pool.query(`
      SELECT la.name AS lab_name, COALESCE(SUM(l.hours),0)::float AS hours
      FROM user_activity_log l
      LEFT JOIN labs la ON la.id = l.lab_id
      ${where}
      GROUP BY la.name
      ORDER BY hours DESC NULLS LAST
    `, params);

    return res.json({
      hours: total.rows[0].hours,
      credits: total.rows[0].credits,
      by_lab: byLab.rows
    });
  } catch (e) {
    console.error('[mySummary]', e);
    return res.status(500).json({ error: 'Failed to load summary' });
  }
}

// ---------- helper: PDF en formato "tarjeta" (labels + valores, con salto automático) ----------
async function generateHistoryPDFBuffer(rows, { from, to }) {
  const labelWidth = 90;                 // ancho de la columna de etiquetas (Fecha/Tipo/etc.)
  const gap = 10;                        // espacio entre etiqueta y valor
  const lineGap = 4;                     // espacio vertical entre líneas dentro de una tarjeta

  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const startX = doc.page.margins.left;
      const innerW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const bottom = () => doc.page.height - doc.page.margins.bottom;
      let y = doc.page.margins.top;

      const fmtDate = v => new Date(v).toISOString().replace('T',' ').slice(0,16);
      const asNum = v => Number(v ?? 0);

      function header() {
        doc.font('Helvetica-Bold').fontSize(16).text('Historial de Uso — LabTec', startX, y);
        y = doc.y + 6;
        if (from || to) {
          doc.font('Helvetica').fontSize(10)
            .text(`Rango: ${from || '…'} → ${to || '…'}`, startX, y);
          y = doc.y + 8;
        }
        doc.moveTo(startX, y).lineTo(startX + innerW, y)
          .strokeColor('#CCCCCC').lineWidth(1).stroke();
        y += 10;
      }

      function maybeBreak(needed = 0) {
        if (y + needed > bottom()) {
          doc.addPage();
          y = doc.page.margins.top;
          header();
        }
      }

      function field(label, value) {
        const v = value == null ? '-' : String(value);
        const valueW = innerW - labelWidth - gap;
        const h = Math.max(14, doc.heightOfString(v, { width: valueW }));
        maybeBreak(h + lineGap);

        doc.font('Helvetica-Bold').fontSize(11)
          .text(`${label}:`, startX, y, { width: labelWidth });

        doc.font('Helvetica').fontSize(11)
          .text(v, startX + labelWidth + gap, y, { width: valueW });

        y += h + lineGap;
      }

      function cardSeparator() {
        doc.moveTo(startX, y).lineTo(startX + innerW, y)
          .strokeColor('#EAEAEA').lineWidth(1).stroke();
        y += 10;
      }

      // ---- render ----
      header();

      rows.forEach((r, i) => {
        // estimar altura mínima de tarjeta y forzar salto si no cabe
        maybeBreak(80);

        field('Fecha', fmtDate(r.event_time));
        field('Tipo', r.activity_type);
        field('Laboratorio', r.lab_name || '');
        field('Recurso', r.resource_name || '');
        field('Horas', asNum(r.hours).toFixed(2));
        if (asNum(r.credits) > 0) field('Créditos', asNum(r.credits).toFixed(2));

        if (r.meta) {
          let meta = typeof r.meta === 'object' ? JSON.stringify(r.meta, null, 2) : String(r.meta);
          // si hay un meta gigantesco, puedes truncarlo:
          // if (meta.length > 1200) meta = meta.slice(0,1200) + '…';
          field('Detalle', meta);
        }

        cardSeparator();
      });

      // Totales de horas al final (opcional)
      const totalHours = rows.reduce((acc, r) => acc + asNum(r.hours), 0);
      maybeBreak(30);
      doc.font('Helvetica-Bold').fontSize(11)
         .text('Total horas:', startX + innerW - 150, y, { width: 90, align: 'right' });
      doc.font('Helvetica').fontSize(11)
         .text(totalHours.toFixed(2), startX + innerW - 60, y, { width: 60, align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}


async function exportMyHistory(req, res) {
  try {
    const userId = req.user.id;
    const { from, to, type='all', format='excel', delivery='link' } = req.query; // delivery: link|download
    const rows = await fetchHistoryRows(userId, { from, to, type, limit: 10000, offset: 0 });

    // carpeta destino: uploads/reports/<userId>/
    const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
    const reportDir = path.join(uploadsRoot, 'reports', String(userId));
    await fs.promises.mkdir(reportDir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = `historial_${type}_${ts}`;
    const pubBase = `/uploads/reports/${userId}`; // servido estático por server.js

    if (format === 'pdf') {
      const filename = `${baseName}.pdf`;
      const filePath = path.join(reportDir, filename);
      const publicUrl = `${pubBase}/${filename}`;

      // genera PDF en Buffer y guarda en disco
      const pdfBuffer = await generateHistoryPDFBuffer(rows, { from, to });
      await fs.promises.writeFile(filePath, pdfBuffer);

      if (delivery === 'download') {
        res.setHeader('Content-Type','application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return fs.createReadStream(filePath).pipe(res);
      }
      return res.json({ ok: true, url: publicUrl, filename });
    }

    // EXCEL por defecto
    const filename = `${baseName}.xlsx`;
    const filePath = path.join(reportDir, filename);
    const publicUrl = `${pubBase}/${filename}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Historial');
    ws.columns = [
      { header:'Fecha', key:'fecha', width:20 },
      { header:'Tipo', key:'tipo', width:28 },
      { header:'Laboratorio', key:'lab', width:24 },
      { header:'Recurso', key:'recurso', width:24 },
      { header:'Horas', key:'horas', width:10 },
      { header:'Créditos', key:'credits', width:10 },
      { header:'Detalle', key:'detalle', width:40 },
    ];
    rows.forEach(r => {
      ws.addRow({
        fecha: fmt(r.event_time),
        tipo: r.activity_type,
        lab: r.lab_name || '',
        recurso: r.resource_name || '',
        horas: Number(r.hours ?? 0),          // 👈
        credits: Number(r.credits ?? 0),      // 👈
        detalle: r.meta ? JSON.stringify(r.meta) : ''
        });
    });

    await wb.xlsx.writeFile(filePath);

    if (delivery === 'download') {
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    return res.json({ ok: true, url: publicUrl, filename });
  } catch (e) {
    console.error('[exportMyHistory]', e);
    return res.status(500).json({ error: 'Failed to export history' });
  }
}

module.exports = { myHistory, mySummary, exportMyHistory };
