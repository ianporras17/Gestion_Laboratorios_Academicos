// apps/api/src/utils/reportExport.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function ensureUploadsDir() {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}
function safe(val) {
  return String(val ?? '').replace(/[^\w.-]/g, '_');
}
function buildFilename(kind, format, range = {}) {
  const f = range?.from ? String(range.from).slice(0, 10) : 'NA';
  const t = range?.to ? String(range.to).slice(0, 10) : 'NA';
  return `${safe(kind)}_${f}_${t}.${format}`;
}

/* ---------- Bloques PDF (bonito) ---------- */
function drawHeader(doc, title, rangeText) {
  doc
    .fontSize(18).font('Helvetica-Bold').text(title, { align: 'left' })
    .moveDown(0.25)
    .fontSize(10).font('Helvetica').fillColor('#666').text(rangeText, { align: 'left' })
    .fillColor('#000').moveDown(0.5);

  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y)
     .strokeColor('#e5e7eb').stroke().moveDown(0.6);
}

function drawKpis(doc, kpis) {
  const startX = doc.page.margins.left;
  const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cols = Math.max(1, Math.min(3, kpis.length || 1));
  const gap = 10;
  const w = usable / cols - gap;
  const y = doc.y;

  kpis.slice(0, 3).forEach((k, i) => {
    const x = startX + i * (w + gap);
    doc.roundedRect(x, y, w, 58, 10).fillAndStroke('#f9fafb', '#f3f4f6');
    doc.fillColor('#6b7280').fontSize(9).text(k.label, x + 12, y + 10, { width: w - 24 });
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(18).text(String(k.value), x + 12, y + 26, { width: w - 24 });
  });
  doc.fillColor('#000').moveDown(2.8);
}

function drawUsageTable(doc, rows) {
  const startX = doc.page.margins.left;
  let y = doc.y + 6;

  const widths = [220, 180, 70, 110]; // Recurso, Usuario, Usos, Último uso
  const rowH = 24;
  const totalW = widths.reduce((a, c) => a + c, 0);

  // header
  doc.rect(startX, y, totalW, rowH).fill('#f3f4f6');
  let x = startX + 10;
  doc.fillColor('#374151').font('Helvetica-Bold').fontSize(10);
  ['Recurso', 'Usuario', 'Usos', 'Último uso'].forEach((h, i) => {
    doc.text(h, x, y + 7, { width: widths[i] - 20, ellipsis: true });
    x += widths[i];
  });
  doc.fillColor('#000').font('Helvetica').fontSize(10);
  y += rowH;

  // rows
  rows.forEach((r, i) => {
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (i % 2 === 1) doc.rect(startX, y, totalW, rowH).fill('#fafafa');

    let x = startX + 10;
    const cells = [
      r.resource_name || r.resource_id,
      r.user_email || r.user_id,
      r.times_used ?? '0',
      r.last_use ? String(r.last_use).slice(0, 19) : '—',
    ];
    cells.forEach((val, idx) => {
      doc.fillColor('#111827').text(String(val), x, y + 7, { width: widths[idx] - 20, ellipsis: true });
      x += widths[idx];
    });
    doc.fillColor('#000');
    y += rowH;
  });

  if (!rows.length) {
    doc.font('Helvetica-Oblique').fillColor('#6b7280').text('— Sin datos —');
    doc.fillColor('#000');
  }

  doc.moveDown(1.2);
}

function exportUsagePdf(res, data, range, filename) {
  const uploadsDir = ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);

  const doc = new PDFDocument({ margin: 48, size: 'A4', info: { Title: 'USAGE' } });
  const fsStream = fs.createWriteStream(filePath);
  doc.pipe(fsStream);
  doc.pipe(res);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const rangeText = `${range?.from ? String(range.from).slice(0, 10) : ''}${range?.from && range?.to ? ' → ' : ''}${range?.to ? String(range.to).slice(0, 10) : ''}`;
  drawHeader(doc, 'Reporte: USAGE', rangeText);

  const uniqueResources = new Set(data.map(r => r.resource_id)).size;
  const uniqueUsers = new Set(data.map(r => r.user_id)).size;
  const totalUses = data.reduce((a, r) => a + Number(r.times_used || 0), 0);

  drawKpis(doc, [
    { label: 'Recursos únicos', value: uniqueResources },
    { label: 'Usuarios únicos', value: uniqueUsers },
    { label: 'Usos totales', value: totalUses },
  ]);

  drawUsageTable(doc, data);

  doc
    .moveDown(1)
    .fontSize(9)
    .fillColor('#6b7280')
    .text('Generado por Gestión de Laboratorios Académicos', { align: 'right' });

  doc.end();
}

/* ---------- XLSX básico ---------- */
async function exportXlsx(kind, data, res, filename) {
  const ExcelJS = require('exceljs');
  const uploadsDir = ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);

  const wb = new ExcelJS.Workbook();

  const addSheetFromArray = (name, arr) => {
    const sh = wb.addWorksheet(name.slice(0, 31) || 'Sheet');
    if (!Array.isArray(arr) || !arr.length) {
      sh.addRow(['Sin datos']);
      return;
    }
    const headers = Object.keys(arr[0]);
    sh.addRow(headers);
    sh.getRow(1).font = { bold: true };
    arr.forEach(row => sh.addRow(headers.map(h => row[h])));
    sh.columns?.forEach(c => {
      const headerLen = String(c.header || '').length;
      c.width = Math.max(12, headerLen + 2);
    });
  };

  if (kind === 'usage') {
    addSheetFromArray('Usage', data);
  } else if (kind === 'inventory') {
    addSheetFromArray('Equipos', data.equipos || []);
    addSheetFromArray('Materiales', data.materiales || []);
  } else if (kind === 'maintenance') {
    addSheetFromArray('Mantenimientos', (data.mantenimientos || []));
    addSheetFromArray('Frecuencia', (data.frecuencia || []));
  }

  await wb.xlsx.writeFile(filePath);

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  fs.createReadStream(filePath).pipe(res);
}

/* ---------- Punto de entrada que espera tu controller ---------- */
/**
 * @param {'usage'|'inventory'|'maintenance'} kind
 * @param {'pdf'|'xlsx'} format
 * @param {any} data
 * @param {import('express').Response} res
 * @param {{from?: Date, to?: Date}} range
 */
async function exportReport(kind, format, data, res, range = {}) {
  const filename = buildFilename(kind, format, range);

  if (format === 'pdf') {
    if (kind === 'usage') {
      return exportUsagePdf(res, data, range, filename);
    }
    // Para inventory/maintenance puedes agregar tablas específicas luego.
    // De momento, generemos un PDF sencillo con resumen JSON (para no romper).
    const uploadsDir = ensureUploadsDir();
    const filePath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ margin: 48, size: 'A4', info: { Title: kind.toUpperCase() } });
    const fsStream = fs.createWriteStream(filePath);
    doc.pipe(fsStream);
    doc.pipe(res);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const rangeText = `${range?.from ? String(range.from).slice(0, 10) : ''}${range?.from && range?.to ? ' → ' : ''}${range?.to ? String(range.to).slice(0, 10) : ''}`;
    drawHeader(doc, `Reporte: ${kind.toUpperCase()}`, rangeText);

    // KPI genérico
    const total = Array.isArray(data) ? data.length : Object.values(data || {}).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0);
    drawKpis(doc, [{ label: 'Registros', value: total }]);

    // Resumen plano
    doc.font('Helvetica').fontSize(10).fillColor('#111827')
       .text('Resumen:', { underline: true })
       .moveDown(0.5)
       .font('Courier').fontSize(9)
       .text(JSON.stringify(data).slice(0, 20000), { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });

    doc.end();
    return;
  }

  if (format === 'xlsx') {
    return exportXlsx(kind, data, res, filename);
  }

  res.status(400).json({ error: 'Formato no soportado' });
}

module.exports = {
  exportReport,
};
