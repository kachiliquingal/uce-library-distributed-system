import { DailyLoanCount, FineRevenueSummary } from './ReportMetric';

export type ExportPeriod = 'day' | 'week' | 'month' | 'year';
export type ExportType = 'loans' | 'top-books' | 'fines' | 'summary';
export type ExportFormat = 'pdf' | 'csv';

export interface ExportOptions {
  period: ExportPeriod;
  type: ExportType;
  format: ExportFormat;
  faculty?: string;
  requestedBy?: string;
}

export interface FacultyBookStat {
  bookId: string;
  title: string;
  isbn: string;
  author: string;
  faculty: string;
  borrowCount: number;
  activeLoans: number;
}

export interface ReportSummaryData {
  loansPerDay?: DailyLoanCount[];
  topBooks?: FacultyBookStat[];
  activeUsers?: number;
  fineRevenue?: FineRevenueSummary;
}
