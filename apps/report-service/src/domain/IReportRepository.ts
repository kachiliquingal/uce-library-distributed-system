import { ReportMetric, DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from './ReportMetric';

export interface IReportRepository {
  saveMetric(metric: ReportMetric): Promise<void>;
  getLoansPerDay(days?: number): Promise<DailyLoanCount[]>;
  getTopBorrowedBooks(limit?: number): Promise<TopBorrowedBook[]>;
  getActiveUsersCount(days?: number): Promise<number>;
  getFineRevenueSummary(): Promise<FineRevenueSummary>;
}
