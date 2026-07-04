import { IReportRepository } from '../../domain/IReportRepository';
import { ReportMetric, DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from '../../domain/ReportMetric';
import { logger } from '../../utils/logger';

export class AnalyticsUseCase {
  constructor(private reportRepo: IReportRepository) {}

  async recordEvent(measurement: string, tags: Record<string, string>, fields: Record<string, number | string | boolean>): Promise<void> {
    try {
      const metric: ReportMetric = {
        measurement,
        tags,
        fields,
        timestamp: new Date()
      };
      await this.reportRepo.saveMetric(metric);
      logger.info(`Recorded metric [${measurement}]`, { tags, fields });
    } catch (error) {
      logger.error(`Failed to record metric [${measurement}]:`, error);
    }
  }

  async getLoansPerDay(days = 7): Promise<DailyLoanCount[]> {
    return this.reportRepo.getLoansPerDay(days);
  }

  async getTopBorrowedBooks(limit = 5): Promise<TopBorrowedBook[]> {
    return this.reportRepo.getTopBorrowedBooks(limit);
  }

  async getActiveUsersCount(days = 30): Promise<number> {
    return this.reportRepo.getActiveUsersCount(days);
  }

  async getFineRevenueSummary(): Promise<FineRevenueSummary> {
    return this.reportRepo.getFineRevenueSummary();
  }
}
