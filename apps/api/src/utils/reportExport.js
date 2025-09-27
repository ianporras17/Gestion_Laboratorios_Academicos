// apps/api/src/utils/reportExport.js
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/* ---------- Utilidades comunes ---------- */
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

  let base;
  if (kind === 'usage') base = 'ReporteOperativo_UsoRecursos';
  else if (kind === 'inventory') base = 'ReporteOperativo_Inventario';
  else if (kind === 'maintenance') base = 'ReporteOperativo_Mantenimientos';
  else base = `ReporteOperativo_${kind}`;

  return `${safe(base)}_${f}_${t}.${format}`;
}

/* ---------- Helpers de layout PDF ---------- */
const MARGINS = { top: 56, right: 48, bottom: 56, left: 48 };

function pageWidth(doc) {
  return doc.page.width - MARGINS.left - MARGINS.right;
}
function ensureSpace(doc, needed) {
  const limit = doc.page.height - MARGINS.bottom;
  if (doc.y + needed > limit) {
    doc.addPage();
    doc.y = MARGINS.top;
    return true;
  }
  return false;
}
function fmtDate(d) {
  if (!d) return '';
  const dd = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium' }).format(dd);
}
function fmtDateTime(d) {
  if (!d) return '';
  const dd = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(dd);
}

/* ---------- Bloques PDF (bonito y robusto) ---------- */
function drawHeader(doc, title, rangeText) {
  // Título
  doc
    .fontSize(22).font('Helvetica-Bold').fillColor('#000')
    .text(title, MARGINS.left, MARGINS.top, { width: pageWidth(doc) })
    .moveDown(0.2);

  // Rango de fechas
  doc
    .fontSize(12).font('Helvetica').fillColor('#444')
    .text(rangeText, MARGINS.left, doc.y, { width: pageWidth(doc) });

  // Separador
  const y = doc.y + 12;
  doc.moveTo(MARGINS.left, y)
     .lineTo(doc.page.width - MARGINS.right, y)
     .strokeColor('#e5e7eb')
     .stroke();

  doc.y = y + 12;
  doc.fillColor('#000');
}

function drawKpis(doc, kpis) {
  const gap = 16;
  const w = (pageWidth(doc) - gap * 2) / 3; // 3 tarjetas
  const h = 70;

  ensureSpace(doc, h + 24);
  const y = doc.y + 12;
  let x = MARGINS.left;

  const items = kpis.slice(0, 3);
  items.forEach(({ label, value }) => {
    // caja
    doc.roundedRect(x, y, w, h, 12).fillAndStroke('#f9fafb', '#e5e7eb');
    // label
    doc.fillColor('#6b7280').font('Helvetica').fontSize(11)
       .text(label, x + 12, y + 12, { width: w - 24 });
    // valor
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(26)
       .text(String(value ?? 0), x + 12, y + 32, { width: w - 24 });

    x += w + gap;
  });

  doc.fillColor('#000');
  doc.y = y + h + 18;
}

function drawUsageTable(doc, rows) {
  // Definición de columnas (ancho adaptable a la página)
  const W = pageWidth(doc);
  const COLS = [
    { key: 'resource_name', label: 'Recurso',     width: Math.max(240, Math.floor(W * 0.40)) },
    { key: 'user_email',    label: 'Usuario',     width: Math.max(160, Math.floor(W * 0.28)) },
    { key: 'times_used',    label: 'Usos',        width: 60 },
    { key: 'last_use',      label: 'Último uso',  width: Math.max(140, Math.floor(W * 0.24)) },
  ];
  const totalW = COLS.reduce((s, c) => s + c.width, 0);
  if (totalW > W) {
    const factor = W / totalW;
    COLS.forEach(c => c.width = Math.floor(c.width * factor));
  }

  const HEADER_H = 28;
  const ROW_PAD_Y = 10;
  const FONT = { header: 11, cell: 10 };

  function headerRow() {
    ensureSpace(doc, HEADER_H + 8);
    const y = doc.y + 8;

    // Fondo
    doc.rect(MARGINS.left, y, W, HEADER_H).fillAndStroke('#f3f4f6', '#e5e7eb');

    // Títulos
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(FONT.header);
    let x = MARGINS.left;
    COLS.forEach(col => {
      doc.text(col.label, x + 8, y + 7, { width: col.width - 16 });
      x += col.width;
    });

    doc.y = y + HEADER_H;
    doc.fillColor('#000').font('Helvetica').fontSize(FONT.cell);
  }

  function drawRow(r, zebra) {
    // Calcula alto de fila (wrapping)
    const heights = COLS.map(col => {
      let val = r[col.key] ?? '';
      if (col.key === 'last_use' && val) val = fmtDateTime(val);
      return doc.heightOfString(String(val), { width: col.width - 16 });
    });
    const rowH = Math.max(...heights) + ROW_PAD_Y * 2;

    // Salto si no cabe y reimprimir header
    const jumped = ensureSpace(doc, rowH);
    if (jumped) headerRow();

    // Fondo zebra + borde
    const y = doc.y;
    if (zebra) doc.rect(MARGINS.left, y, W, rowH).fill('#fafafa').strokeColor('#e5e7eb').stroke();
    else       doc.rect(MARGINS.left, y, W, rowH).strokeColor('#e5e7eb').stroke();

    // Celdas
    let x = MARGINS.left;
    COLS.forEach(col => {
      let val = r[col.key] ?? '';
      if (col.key === 'last_use' && val) val = fmtDateTime(val);
      doc.fillColor('#111827')
         .text(String(val), x + 8, y + ROW_PAD_Y, { width: col.width - 16, lineBreak: true });
      x += col.width;
    });

    doc.y = y + rowH;
    doc.fillColor('#000');
  }

  // Tabla
  headerRow();

  if (!rows?.length) {
    ensureSpace(doc, 24);
    doc.font('Helvetica-Oblique').fillColor('#6b7280')
       .text('— Sin datos —', MARGINS.left, doc.y + 12, { width: W });
    doc.fillColor('#000');
    doc.moveDown(1.2);
    return;
  }

  rows.forEach((r, i) => drawRow(r, i % 2 === 1));
  doc.moveDown(1.2);
}

function drawFooter(doc) {
  const text = 'Generado por Gestión de Laboratorios Académicos';
  const y = doc.page.height - MARGINS.bottom + 20;
  doc.fontSize(8).fillColor('#6b7280')
     .text(text, MARGINS.left, y, { width: pageWidth(doc), align: 'center' });
  doc.fillColor('#000');
}

/* ---------- Export específico: (PDF) ---------- */
function exportUsagePdf(res, data, range, filename) {
  const uploadsDir = ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);

  const doc = new PDFDocument({
    size: 'A4',
    margins: MARGINS,
    info: { Title: 'Reporte Operativo - Uso de Recursos' }, // <== CAMBIO
  });

  const fsStream = fs.createWriteStream(filePath);
  doc.pipe(fsStream);
  doc.pipe(res);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  const rangeText = `${range?.from ? fmtDate(range.from) : ''}${range?.from && range?.to ? ' – ' : ''}${range?.to ? fmtDate(range.to) : ''}`;

  drawHeader(doc, 'Reporte Operativo: Uso de Recursos', rangeText); // <== CAMBIO

  const uniqueResources = new Set(data.map(r => r.resource_id)).size;
  const uniqueUsers = new Set(data.map(r => r.user_id)).size;
  const totalUses = data.reduce((a, r) => a + Number(r.times_used || 0), 0);

  drawKpis(doc, [
    { label: 'Recursos únicos', value: uniqueResources },
    { label: 'Usuarios únicos', value: uniqueUsers },
    { label: 'Usos totales', value: totalUses },
  ]);

  drawUsageTable(doc, data);
  drawFooter(doc);

  doc.end();
}

/* ---------- XLSX con estilo (ExcelJS) ---------- */
async function exportXlsx(kind, data, res, filename) {
  const ExcelJS = require('exceljs');
  const uploadsDir = ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gestión de Laboratorios Académicos';
  wb.created = new Date();

  // Helpers
  const toSafeSheetName = (name) => (name || 'Sheet').slice(0, 31) || 'Sheet';
  const makeTableName = (base) => {
    const b = (base || 'Tabla').replace(/[^A-Za-z0-9_]/g, '');
    return `${b}_${Date.now().toString(36)}`;
  };

  const autoWidth = (sh) => {
    const MIN = 10, MAX = 42;
    sh.columns?.forEach((col) => {
      let max = 0;
      const head = (col.header ?? '').toString();
      max = Math.max(max, head.length);
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const v = cell.value;
        const s = (v == null) ? '' : (typeof v === 'object' && v.text ? v.text : String(v));
        max = Math.max(max, s.length);
      });
      col.width = Math.max(MIN, Math.min(MAX, Math.ceil(max + 2)));
    });
  };

  // Crea una hoja con UNA tabla nativa (sin autoFilter separado ni filas pre-escritas)
  const addStyledTable = (sheetName, rowsArray) => {
    const name = toSafeSheetName(sheetName);
    const sh = wb.addWorksheet(name);

    if (!Array.isArray(rowsArray) || rowsArray.length === 0) {
      sh.addRow(['Sin datos']);
      autoWidth(sh);
      return;
    }

    const headers = Object.keys(rowsArray[0]);

    // Agregar tabla directamente (la tabla crea el header + filas)
    const tableName = makeTableName(name);
    sh.addTable({
      name: tableName,
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium9',
        showRowStripes: true,
      },
      columns: headers.map((h) => ({ name: h })),
      rows: rowsArray.map((obj) => headers.map((h) => obj[h])),
    });

    // Congelar encabezado (ySplit=1) — la fila 1 existe porque la creó la tabla
    sh.views = [{ state: 'frozen', ySplit: 1 }];

    // (Opcional) resaltar columna "status" si existe
    const statusIdx = headers.findIndex((h) => h.toLowerCase() === 'status');
    if (statusIdx >= 0) {
      for (let r = 2; r <= rowsArray.length + 1; r++) {
        const cell = sh.getCell(r, statusIdx + 1);
        const v = (cell.value ?? '').toString().toUpperCase();
        if (v.includes('CRIT') || v.includes('BAJO') || v.includes('CRÍT')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E6' } };
          cell.font = { color: { argb: 'FF991B1B' }, bold: true };
        } else if (v.includes('DISP')) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
          cell.font = { color: { argb: 'FF065F46' } };
        }
      }
    }

    autoWidth(sh); // ajustar anchos después de que existan las celdas
  };

  // --- Selección por tipo de reporte ---
  if (kind === 'usage') {
    addStyledTable('Uso de Recursos', Array.isArray(data) ? data : []);
  } else if (kind === 'inventory') {
    addStyledTable('Equipos', data?.equipos || []);
    addStyledTable('Materiales', data?.materiales || []);
  } else if (kind === 'maintenance') {
    addStyledTable('Mantenimientos', data?.mantenimientos || []);
    addStyledTable('Frecuencia', data?.frecuencia || []);
  } else {
    addStyledTable('Datos', Array.isArray(data) ? data : []);
  }

  await wb.xlsx.writeFile(filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  fs.createReadStream(filePath).pipe(res);
}



/* ---------- Punto de entrada que espera tu controller ---------- */

const titles = {
  usage: 'Reporte Operativo - Uso de Recursos',
  inventory: 'Reporte Operativo - Inventario',
  maintenance: 'Reporte Operativo - Mantenimientos',
};

const visibleHeaders = {
  usage: 'Reporte Operativo: Uso de Recursos',
  inventory: 'Reporte Operativo: Inventario',
  maintenance: 'Reporte Operativo: Mantenimientos',
};

async function exportReport(kind, format, data, res, range = {}) {
  const filename = buildFilename(kind, format, range);

  if (format === 'pdf') {
    if (kind === 'usage') {
      return exportUsagePdf(res, data, range, filename);
    }
    // PDFs genéricos para otros módulos (simple pero sin cortar)
    const uploadsDir = ensureUploadsDir();
    const filePath = path.join(uploadsDir, filename);
    const doc = new PDFDocument({ size: 'A4', margins: MARGINS, info: { Title: titles[kind] || `Reporte Operativo - ${kind}` } });
    const fsStream = fs.createWriteStream(filePath);
    doc.pipe(fsStream);
    doc.pipe(res);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const rangeText = `${range?.from ? fmtDate(range.from) : ''}${range?.from && range?.to ? ' – ' : ''}${range?.to ? fmtDate(range.to) : ''}`;
    drawHeader(doc, visibleHeaders[kind] || `Reporte Operativo: ${kind}`, rangeText);

    // KPI genérico
    const total = Array.isArray(data)
      ? data.length
      : Object.values(data || {}).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0);
    drawKpis(doc, [{ label: 'Registros', value: total }]);

    // Resumen plano con wrapping y saltos
    const W = pageWidth(doc);
    const content = JSON.stringify(data, null, 2);
    const chunkSize = 4000; // evitar cuelgues por bloques demasiado grandes
    for (let i = 0; i < content.length; i += chunkSize) {
      ensureSpace(doc, 24);
      doc.font('Courier').fontSize(9).fillColor('#111827')
         .text(content.slice(i, i + chunkSize), MARGINS.left, doc.y, { width: W });
    }
    drawFooter(doc);
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
