import { AnalyticsUseCase } from '../src/application/use-cases/AnalyticsUseCase';
import { IReportRepository } from '../src/domain/IReportRepository';
import { ReportMetric, DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from '../src/domain/ReportMetric';

class MockReportRepository implements IReportRepository {
  public metrics: ReportMetric[] = [];

  async saveMetric(metric: ReportMetric): Promise<void> {
    this.metrics.push(metric);
  }
  async getLoansPerDay(_days?: number): Promise<DailyLoanCount[]> {
    return [
      { date: '2026-07-01', count: 10 },
      { date: '2026-07-02', count: 15 }
    ];
  }
  async getTopBorrowedBooks(_limit?: number): Promise<TopBorrowedBook[]> {
    return [
      { bookId: '123', title: 'Test Book 1', borrowCount: 20 },
      { bookId: '456', title: 'Test Book 2', borrowCount: 15 }
    ];
  }
  async getActiveUsersCount(_days?: number): Promise<number> {
    return 42;
  }
  async getFineRevenueSummary(): Promise<FineRevenueSummary> {
    return {
      totalRevenue: 100.50,
      paidCount: 10,
      pendingCount: 2,
      pendingAmount: 20.00
    };
  }
}

describe("Report Service Unit Tests", () => {
  test("AnalyticsUseCase Tests", async () => {
    const repo = new MockReportRepository();
    const useCase = new AnalyticsUseCase(repo);

    await useCase.recordEvent('loans', { bookId: '123', userId: '456', action: 'borrowed' }, { count: 1 });
    expect(repo.metrics.length).toBe(1);
    expect(repo.metrics[0].measurement).toBe('loans');
    expect(repo.metrics[0].tags.bookId).toBe('123');
    expect(repo.metrics[0].fields.count).toBe(1);

    const loans = await useCase.getLoansPerDay(7);
    expect(loans.length).toBe(2);
    expect(loans[0].count).toBe(10);

    const topBooks = await useCase.getTopBorrowedBooks(5);
    expect(topBooks.length).toBe(2);
    expect(topBooks[0].title).toBe('Test Book 1');

    const activeUsers = await useCase.getActiveUsersCount(30);
    expect(activeUsers).toBe(42);

    const fineSummary = await useCase.getFineRevenueSummary();
    expect(fineSummary.totalRevenue).toBe(100.50);
    expect(fineSummary.paidCount).toBe(10);
  });
});
