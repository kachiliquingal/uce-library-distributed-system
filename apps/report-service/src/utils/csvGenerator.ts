import { FacultyBookStat, ExportOptions, ReportSummaryData } from '../domain/ExportTypes';
import { DailyLoanCount, FineRevenueSummary } from '../domain/ReportMetric';

export class CsvGenerator {
  static generateCsv(data: ReportSummaryData | unknown[], options: ExportOptions): string {
    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    let csvContent = bom;

    const separator = ';'; // Semicolon is standard in Spanish Excel
    const quote = (str: unknown) => `"${String(str ?? '').replace(/"/g, '""')}"`;

    if (options.type === 'top-books') {
      const books: FacultyBookStat[] = Array.isArray(data) ? (data as FacultyBookStat[]) : ((data as ReportSummaryData).topBooks || []);
      csvContent += [
        'Ranking', 'Título del Libro', 'ISBN', 'Autor', 'Facultad', 'Total Préstamos', 'Préstamos Activos'
      ].map(quote).join(separator) + '\r\n';

      books.forEach((book, index) => {
        csvContent += [
          index + 1,
          book?.title || 'Sin título',
          book?.isbn || book?.bookId || 'N/A',
          book?.author || 'Anónimo',
          book?.faculty || 'General',
          book?.borrowCount || 0,
          book?.activeLoans || 0
        ].map(quote).join(separator) + '\r\n';
      });
    } else if (options.type === 'loans') {
      const loans: DailyLoanCount[] = Array.isArray(data) ? (data as DailyLoanCount[]) : ((data as ReportSummaryData).loansPerDay || []);
      csvContent += ['Fecha', 'Préstamos Registrados', 'Período', 'Facultad'].map(quote).join(separator) + '\r\n';

      loans.forEach((item) => {
        csvContent += [
          item?.date || 'N/A',
          item?.count || 0,
          options.period.toUpperCase(),
          options.faculty || 'Todas las Facultades'
        ].map(quote).join(separator) + '\r\n';
      });
    } else if (options.type === 'fines') {
      const fines: FineRevenueSummary = (data as ReportSummaryData).fineRevenue || (data as FineRevenueSummary) || {};
      csvContent += ['Métrica Financiera', 'Cantidad de Transacciones', 'Monto Total ($ USD)'].map(quote).join(separator) + '\r\n';
      csvContent += ['Multas Pagadas (Ingresos)', fines?.paidCount || 0, Number(fines?.totalRevenue || 0).toFixed(2)].map(quote).join(separator) + '\r\n';
      csvContent += ['Multas Pendientes (Por Cobrar)', fines?.pendingCount || 0, Number(fines?.pendingAmount || 0).toFixed(2)].map(quote).join(separator) + '\r\n';
      csvContent += ['TOTAL GENERAL', Number(fines?.paidCount || 0) + Number(fines?.pendingCount || 0), (Number(fines?.totalRevenue || 0) + Number(fines?.pendingAmount || 0)).toFixed(2)].map(quote).join(separator) + '\r\n';
    } else {
      // Full Summary CSV
      const summary = (data as ReportSummaryData) || {};
      csvContent += quote('=== REPORTE EJECUTIVO INTEGRAL - UCE LIBRARY ===') + '\r\n\r\n';
      csvContent += ['Parámetro', 'Valor', 'Detalle'].map(quote).join(separator) + '\r\n';
      csvContent += ['Período Reportado', options.period.toUpperCase(), 'Filtro temporal aplicado'].map(quote).join(separator) + '\r\n';
      csvContent += ['Facultad Filtrada', options.faculty || 'Todas las Facultades', 'Alcance universitario'].map(quote).join(separator) + '\r\n';
      csvContent += ['Sesiones Activas en Línea (30d)', summary?.activeUsers || 0, 'Interacciones, accesos y consultas registradas en el período'].map(quote).join(separator) + '\r\n\r\n';

      csvContent += quote('--- TOP LIBROS MÁS PRESTADOS ---') + '\r\n';
      csvContent += ['Ranking', 'Título', 'Facultad', 'Préstamos'].map(quote).join(separator) + '\r\n';
      const books: FacultyBookStat[] = summary?.topBooks || [];
      books.slice(0, 10).forEach((b, idx) => {
        csvContent += [idx + 1, b?.title || 'Sin título', b?.faculty || 'General', b?.borrowCount || 0].map(quote).join(separator) + '\r\n';
      });
    }

    return csvContent;
  }
}
