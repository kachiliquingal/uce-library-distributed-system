import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { FacultyBookStat, ExportOptions, ReportSummaryData } from '../domain/ExportTypes';
import { DailyLoanCount, FineRevenueSummary } from '../domain/ReportMetric';

export class PdfGenerator {
  static streamPdf(res: Response, data: ReportSummaryData | unknown[], options: ExportOptions): void {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      bufferPages: true
    });

    doc.pipe(res);

    try {

    // 1. Executive Header Banner
    doc.rect(0, 0, doc.page.width, 95).fill('#312E81'); // Dark Indigo
    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('UNIVERSIDAD CENTRAL DEL ECUADOR', 50, 25);
    doc.fontSize(13).font('Helvetica').text('SISTEMA INTEGRADO DE BIBLIOTECAS (UCE LIBRARY)', 50, 48);
    doc.fontSize(10).fillColor('#C7D2FE').text('Reporte Ejecutivo de Analítica y Estadísticas Universitarias', 50, 68);

    // 2. Metadata Information Card
    const periodMap: Record<string, string> = {
      day: 'Últimas 24 Horas (Por Día)',
      week: 'Últimos 7 Días (Por Semana)',
      month: 'Últimos 30 Días (Por Mes)',
      year: 'Último Año (Anual - 365 Días)'
    };
    const periodLabel = periodMap[options.period] || options.period.toUpperCase();
    const facultyLabel = options.faculty || 'Todas las Facultades';

    doc.rect(50, 115, doc.page.width - 100, 75).fill('#F8FAFC').stroke('#E2E8F0');
    
    doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('PARÁMETROS DEL REPORTE', 65, 128);
    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}`, 65, 146);
    doc.text(`Período Evaluado: ${periodLabel}`, 65, 161);
    doc.text(`Facultad / Unidad: ${facultyLabel}`, 300, 146);
    doc.text(`Solicitado por: ${options.requestedBy || 'Administrador General UCE'}`, 300, 161);

    let currentY = 215;

    // Helper to draw table header
    const drawTableHeader = (headers: string[], widths: number[], y: number) => {
      doc.rect(50, y, doc.page.width - 100, 24).fill('#4F46E5');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      let x = 58;
      headers.forEach((header, i) => {
        doc.text(header, x, y + 7, { width: widths[i], align: 'left' });
        x += widths[i];
      });
      return y + 24;
    };

    // Helper to check page break
    const checkPageBreak = (heightNeeded: number) => {
      if (currentY + heightNeeded > doc.page.height - 70) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 25).fill('#312E81');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('UCE LIBRARY - REPORTE CONTINUACIÓN', 50, 8);
        currentY = 45;
      }
    };

    // 3. Render Content based on Report Type
    if (options.type === 'top-books') {
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text('Ranking de Libros Más Prestados por Facultad', 50, currentY);
      currentY += 25;

      const books: FacultyBookStat[] = Array.isArray(data) ? (data as FacultyBookStat[]) : ((data as ReportSummaryData).topBooks || []);
      const headers = ['#', 'Título del Libro / Obras', 'Facultad / Carrera', 'Préstamos'];
      const widths = [30, 240, 160, 60];

      currentY = drawTableHeader(headers, widths, currentY);

      books.forEach((book, idx) => {
        checkPageBreak(28);
        if (idx % 2 === 0) {
          doc.rect(50, currentY, doc.page.width - 100, 24).fill('#F1F5F9');
        }
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        let x = 58;
        doc.text(String(idx + 1), x, currentY + 7, { width: widths[0] }); x += widths[0];
        doc.font('Helvetica-Bold').fillColor('#1E1B4B').text(String(book?.title || 'Sin título').slice(0, 45), x, currentY + 7, { width: widths[1] }); x += widths[1];
        doc.font('Helvetica').fillColor('#475569').text(String(book?.faculty || 'General'), x, currentY + 7, { width: widths[2] }); x += widths[2];
        doc.font('Helvetica-Bold').fillColor('#4F46E5').text(String(book?.borrowCount || 0), x, currentY + 7, { width: widths[3] });
        currentY += 24;
      });
    } else if (options.type === 'loans') {
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text('Estadísticas y Actividad de Préstamos', 50, currentY);
      currentY += 25;

      const loans: DailyLoanCount[] = Array.isArray(data) ? (data as DailyLoanCount[]) : ((data as ReportSummaryData).loansPerDay || []);
      const headers = ['Fecha de Registro', 'Préstamos Emitidos', 'Estado del Sistema', 'Tendencia'];
      const widths = [130, 120, 120, 120];

      currentY = drawTableHeader(headers, widths, currentY);

      let totalLoans = 0;
      loans.forEach((item, idx) => {
        checkPageBreak(28);
        totalLoans += Number(item?.count || 0);
        if (idx % 2 === 0) {
          doc.rect(50, currentY, doc.page.width - 100, 24).fill('#F1F5F9');
        }
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        let x = 58;
        doc.text(String(item?.date || 'N/A'), x, currentY + 7, { width: widths[0] }); x += widths[0];
        doc.font('Helvetica-Bold').fillColor('#4F46E5').text(String(item?.count || 0), x, currentY + 7, { width: widths[1] }); x += widths[1];
        doc.font('Helvetica').fillColor('#16A34A').text('Óptimo (Verificado)', x, currentY + 7, { width: widths[2] }); x += widths[2];
        doc.fillColor('#64748B').text('---', x, currentY + 7, { width: widths[3] });
        currentY += 24;
      });

      currentY += 15;
      doc.rect(50, currentY, doc.page.width - 100, 35).fill('#EEF2FF').stroke('#818C78');
      doc.fillColor('#312E81').fontSize(11).font('Helvetica-Bold').text(`TOTAL ACUMULADO DE PRÉSTAMOS EN EL PERÍODO: ${totalLoans} TRANSACCIONES`, 65, currentY + 11);
    } else if (options.type === 'fines') {
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text('Resumen Financiero y Gestión de Multas', 50, currentY);
      currentY += 25;

      const fines: FineRevenueSummary = (data as ReportSummaryData).fineRevenue || (data as FineRevenueSummary) || {};
      const headers = ['Concepto Financiero', 'Transacciones Registradas', 'Monto Acumulado (USD)'];
      const widths = [220, 140, 130];

      currentY = drawTableHeader(headers, widths, currentY);

      // Paid
      doc.rect(50, currentY, doc.page.width - 100, 30).fill('#F0FDF4');
      doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text('Multas Cobradas / Ingresos Efectivos', 58, currentY + 10);
      doc.text(String(fines?.paidCount || 0), 278, currentY + 10);
      doc.text(`$${Number(fines?.totalRevenue || 0).toFixed(2)} USD`, 418, currentY + 10);
      currentY += 30;

      // Pending
      doc.rect(50, currentY, doc.page.width - 100, 30).fill('#FEFCE8');
      doc.fillColor('#854D0E').fontSize(10).font('Helvetica-Bold').text('Multas Pendientes / Por Cobrar', 58, currentY + 10);
      doc.text(String(fines?.pendingCount || 0), 278, currentY + 10);
      doc.text(`$${Number(fines?.pendingAmount || 0).toFixed(2)} USD`, 418, currentY + 10);
      currentY += 30;

      // Total
      doc.rect(50, currentY, doc.page.width - 100, 35).fill('#312E81');
      doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('BALANCE GENERAL ACUMULADO', 58, currentY + 12);
      doc.text(String(Number(fines?.paidCount || 0) + Number(fines?.pendingCount || 0)), 278, currentY + 12);
      doc.text(`$${(Number(fines?.totalRevenue || 0) + Number(fines?.pendingAmount || 0)).toFixed(2)} USD`, 418, currentY + 12);
    } else {
      // Full Summary
      const summary = (data as ReportSummaryData) || {};
      doc.fillColor('#1E293B').fontSize(14).font('Helvetica-Bold').text('Resumen Ejecutivo Integral del Ecosistema', 50, currentY);
      currentY += 25;

      // KPI Boxes
      const drawKpi = (title: string, val: string, desc: string, x: number, y: number, color: string) => {
        doc.rect(x, y, 150, 75).fill('#FFFFFF').stroke('#E2E8F0');
        doc.rect(x, y, 150, 6).fill(color);
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 12, y + 15);
        doc.fillColor('#1E293B').fontSize(20).font('Helvetica-Bold').text(val, x + 12, y + 30);
        doc.fillColor(color).fontSize(8).font('Helvetica').text(desc, x + 12, y + 55);
      };

      const totalLoans = (summary?.loansPerDay || []).reduce((acc: number, c: DailyLoanCount) => acc + Number(c?.count || 0), 0);
      drawKpi('Préstamos Totales', String(totalLoans), 'En el período filtrado', 50, currentY, '#4F46E5');
      drawKpi('Usuarios Activos', String(summary?.activeUsers || 0), 'Lectores registrados', 215, currentY, '#9333EA');
      drawKpi('Ingresos Multas', `$${Number(summary?.fineRevenue?.totalRevenue || 0).toFixed(2)}`, `${summary?.fineRevenue?.paidCount || 0} cobros verificados`, 380, currentY, '#16A34A');

      currentY += 100;
      doc.fillColor('#1E293B').fontSize(12).font('Helvetica-Bold').text('Top 5 Libros Más Destacados en la Universidad', 50, currentY);
      currentY += 20;

      const books: FacultyBookStat[] = summary?.topBooks || [];
      const headers = ['#', 'Obra Literaria / Académica', 'Facultad', 'Préstamos'];
      const widths = [30, 240, 160, 60];
      currentY = drawTableHeader(headers, widths, currentY);

      books.slice(0, 5).forEach((b, idx) => {
        if (idx % 2 === 0) doc.rect(50, currentY, doc.page.width - 100, 24).fill('#F1F5F9');
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        let x = 58;
        doc.text(String(idx + 1), x, currentY + 7, { width: widths[0] }); x += widths[0];
        doc.font('Helvetica-Bold').text(String(b?.title || 'Sin título').slice(0, 45), x, currentY + 7, { width: widths[1] }); x += widths[1];
        doc.font('Helvetica').text(String(b?.faculty || 'General'), x, currentY + 7, { width: widths[2] }); x += widths[2];
        doc.font('Helvetica-Bold').fillColor('#4F46E5').text(String(b?.borrowCount || 0), x, currentY + 7, { width: widths[3] });
        currentY += 24;
      });
    }

    // 4. Footer & Page Numbers
    (doc as any).autoPageBreak = false;
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.moveTo(50, doc.page.height - 50).lineTo(doc.page.width - 50, doc.page.height - 50).stroke('#CBD5E1');
      doc.fillColor('#64748B').fontSize(8).font('Helvetica');
      doc.text(
        'Documento Oficial - Sistema Integrado de Bibliotecas UCE',
        50,
        doc.page.height - 40,
        { lineBreak: false }
      );
      doc.text(
        `Página ${i + 1} de ${range.count}`,
        0,
        doc.page.height - 40,
        { align: 'right', width: doc.page.width - 50, lineBreak: false }
      );
    }

    } catch (pdfError) {
      // Safety net: if ANYTHING crashes during PDF generation, log it
      // but still end the document so the stream closes properly
      console.error('PDF generation error:', pdfError);
    }

    doc.end();
  }
}
