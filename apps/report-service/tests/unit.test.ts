import assert from 'assert';
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

async function runTests() {
  console.log('Running unit tests for report-service...');

  const repo = new MockReportRepository();
  const useCase = new AnalyticsUseCase(repo);

  try {
    // 1. Test Recording Metrics
    await useCase.recordEvent('loans', { bookId: '123', userId: '456', action: 'borrowed' }, { count: 1 });
    assert.strictEqual(repo.metrics.length, 1, 'Metric should be saved in repository');
    assert.strictEqual(repo.metrics[0].measurement, 'loans');
    assert.strictEqual(repo.metrics[0].tags.bookId, '123');
    assert.strictEqual(repo.metrics[0].fields.count, 1);

    // 2. Test Querying Analytics
    const loans = await useCase.getLoansPerDay(7);
    assert.strictEqual(loans.length, 2);
    assert.strictEqual(loans[0].count, 10);

    const topBooks = await useCase.getTopBorrowedBooks(5);
    assert.strictEqual(topBooks.length, 2);
    assert.strictEqual(topBooks[0].title, 'Test Book 1');

    const activeUsers = await useCase.getActiveUsersCount(30);
    assert.strictEqual(activeUsers, 42);

    const fineSummary = await useCase.getFineRevenueSummary();
    assert.strictEqual(fineSummary.totalRevenue, 100.50);
    assert.strictEqual(fineSummary.paidCount, 10);

    console.log('All tests passed successfully! ✅');
  } catch (err: any) {
    console.error('Test failed: ', err.message);
    process.exit(1);
  }
}

runTests();
