const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

function toBufferPDF(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

exports.toPDF = async (kind, data) => {
  const doc = new PDFDocument({ size: 'A4', margin: 32 });
  doc.fontSize(16).text(`Reporte: ${kind.toUpperCase()}`, { underline: true });
  doc.moveDown().fontSize(10);

  if (kind === 'usage') {
    doc.text('Top Recursos:'); doc.moveDown(0.5);
    data.topResources.forEach(r => doc.text(`- ${r.name} (${r.code}): ${r.outs}`));
    doc.moveDown();
    doc.text('Top Usuarios:'); doc.moveDown(0.5);
    data.topUsers.forEach(u => doc.text(`- ${u.user_name}: ${u.outs}`));
  } else if (kind === 'inventory') {
    doc.text('Equipos por Estado:'); doc.moveDown(0.5);
    data.equiposPorEstado.forEach(e => doc.text(`- ${e.status}: ${e.count}`));
    doc.moveDown();
    doc.text('Materiales Críticos:'); doc.moveDown(0.5);
    data.stock.filter(s => s.is_critical).forEach(s => doc.text(`- ${s.name} (${s.code}) stock=${s.stock} min=${s.min_stock}`));
  } else {
    doc.text(`Downtime Promedio (h): ${Number(data.downtime?.avg_downtime_h || 0).toFixed(2)}`);
    doc.moveDown();
    doc.text('Frecuencia (Top):'); doc.moveDown(0.5);
    data.frequency.forEach(f => doc.text(`- ${f.name} (${f.code}): ${f.repairs}`));
  }

  const buffer = await toBufferPDF(doc);
  const filename = `reporte_${kind}.pdf`;
  return { buffer, filename };
};

exports.toXLSX = async (kind, data) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte');

  if (kind === 'usage') {
    const ws1 = wb.addWorksheet('Top Recursos');
    ws1.columns = [{ header: 'Nombre', key: 'name' }, { header: 'Código', key: 'code' }, { header: 'OUTs', key: 'outs' }];
    ws1.addRows(data.topResources);

    const ws2 = wb.addWorksheet('Top Usuarios');
    ws2.columns = [{ header: 'Usuario', key: 'user_name' }, { header: 'OUTs', key: 'outs' }];
    ws2.addRows(data.topUsers);
  } else if (kind === 'inventory') {
    const ws1 = wb.addWorksheet('Equipos por Estado');
    ws1.columns = [{ header: 'Estado', key: 'status' }, { header: 'Cantidad', key: 'count' }];
    ws1.addRows(data.equiposPorEstado);

    const ws2 = wb.addWorksheet('Stock Materiales');
    ws2.columns = [
      { header: 'Nombre', key: 'name' }, { header: 'Código', key: 'code' },
      { header: 'Stock', key: 'stock' }, { header: 'Min', key: 'min_stock' }, { header: 'Crítico', key: 'is_critical' }
    ];
    ws2.addRows(data.stock);

    const ws3 = wb.addWorksheet('Consumo Periodo');
    ws3.columns = [{ header: 'Nombre', key: 'name' }, { header: 'Código', key: 'code' }, { header: 'Consumido', key: 'consumed' }];
    ws3.addRows(data.consumoPeriodo);
  } else {
    const ws1 = wb.addWorksheet('Downtime');
    ws1.columns = [{ header: 'Avg Downtime (h)', key: 'avg_downtime_h' }];
    ws1.addRow({ avg_downtime_h: Number(data.downtime?.avg_downtime_h || 0).toFixed(2) });

    const ws2 = wb.addWorksheet('Frecuencia');
    ws2.columns = [{ header: 'Recurso', key: 'name' }, { header: 'Código', key: 'code' }, { header: 'Reparaciones', key: 'repairs' }];
    ws2.addRows(data.frequency);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `reporte_${kind}.xlsx`;
  return { buffer, filename };
};
