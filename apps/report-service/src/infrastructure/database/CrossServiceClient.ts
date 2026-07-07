import http from 'http';
import { logger } from '../../utils/logger';
import { DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from '../../domain/ReportMetric';

/**
 * CrossServiceClient - Queries REAL data from other microservices (loan-service, fine-service, catalog-service)
 * via their internal private IPs, bypassing InfluxDB entirely.
 *
 * This is the PRIMARY data source for the report dashboard.
 * InfluxDB is only used for time-series if Kafka events have been recorded.
 */
export class CrossServiceClient {
  private loanServiceUrl: string;
  private fineServiceUrl: string;
  private catalogServiceUrl: string;
  private timeout: number;

  private userServiceUrl: string;

  constructor() {
    this.loanServiceUrl = process.env.LOAN_SERVICE_INTERNAL_URL || process.env.LOAN_SERVICE_URL || 'loan-service:3004';
    this.fineServiceUrl = process.env.FINE_SERVICE_INTERNAL_URL || process.env.FINE_SERVICE_URL || 'fine-service:3006';
    this.catalogServiceUrl = process.env.CATALOG_SERVICE_INTERNAL_URL || process.env.CATALOG_SERVICE_URL || 'catalog-service:3002';
    this.userServiceUrl = process.env.USER_SERVICE_URL || process.env.USER_SERVICE_INTERNAL_URL || 'user-service:3003';
    this.timeout = 8000; // 8 second timeout for inter-service calls
    logger.info(`CrossServiceClient initialized: loan=[${this.loanServiceUrl}] fine=[${this.fineServiceUrl}] catalog=[${this.catalogServiceUrl}] user=[${this.userServiceUrl}]`);
  }

  /**
   * Make an HTTP GET request with timeout. Returns parsed JSON or null on failure.
   */
  private httpGet(urlStr: string): Promise<unknown> {
    return new Promise((resolve) => {
      if (!urlStr) {
        resolve(null);
        return;
      }

      const fullUrl = urlStr.startsWith('http') ? urlStr : `http://${urlStr}`;

      try {
        const req = http.get(fullUrl, { timeout: this.timeout }, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              logger.warn(`CrossServiceClient: Failed to parse JSON from ${fullUrl}`);
              resolve(null);
            }
          });
        });

        req.on('error', (err) => {
          logger.warn(`CrossServiceClient: Request to ${fullUrl} failed: ${err.message}`);
          resolve(null);
        });

        req.on('timeout', () => {
          logger.warn(`CrossServiceClient: Request to ${fullUrl} timed out`);
          req.destroy();
          resolve(null);
        });
      } catch (err) {
        logger.warn(`CrossServiceClient: Unexpected error calling ${fullUrl}:`, err);
        resolve(null);
      }
    });
  }

  /**
   * Get REAL loan data from loan-service and compute loans per day.
   */
  async getLoansPerDay(days: number): Promise<DailyLoanCount[] | null> {
    try {
      const url = this.loanServiceUrl
        ? `http://${this.loanServiceUrl}/api/loans/?limit=5000&page=1`
        : '';
      if (!url) return null;

      const response = await this.httpGet(url) as { data?: Array<{ borrowDate?: string; status?: string }> } | null;
      if (!response || !response.data || !Array.isArray(response.data)) return null;

      const loans = response.data;
      if (loans.length === 0) return null;

      // Build a map of date -> count for the last N days
      const now = new Date();
      const dateMap = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dateMap.set(d.toISOString().split('T')[0], 0);
      }

      for (const loan of loans) {
        if (loan.borrowDate) {
          const dateStr = new Date(loan.borrowDate).toISOString().split('T')[0];
          if (dateMap.has(dateStr)) {
            dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
          }
        }
      }

      const result: DailyLoanCount[] = [];
      for (const [date, count] of dateMap.entries()) {
        result.push({ date, count });
      }

      return result.length > 0 ? result : null;
    } catch (err) {
      logger.warn('CrossServiceClient.getLoansPerDay failed:', err);
      return null;
    }
  }

  /**
   * Get REAL top borrowed books from loan-service data.
   */
  async getTopBorrowedBooks(limit: number): Promise<TopBorrowedBook[] | null> {
    try {
      const url = this.loanServiceUrl
        ? `http://${this.loanServiceUrl}/api/loans/?limit=5000&page=1`
        : '';
      if (!url) return null;

      const response = await this.httpGet(url) as { data?: Array<{ isbn?: string }> } | null;
      if (!response || !response.data || !Array.isArray(response.data)) return null;

      const loans = response.data;
      if (loans.length === 0) return null;

      // Count borrows per ISBN
      const isbnCount = new Map<string, number>();
      for (const loan of loans) {
        const isbn = loan.isbn || 'unknown';
        isbnCount.set(isbn, (isbnCount.get(isbn) || 0) + 1);
      }

      // Sort by count descending and take top N
      const sorted = Array.from(isbnCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // Try to get book titles from catalog-service
      const bookTitles = new Map<string, string>();
      if (this.catalogServiceUrl) {
        try {
          const catalogResponse = await this.httpGet(`http://${this.catalogServiceUrl}/api/catalog/books`) as Array<{ isbn?: string; title?: string }> | null;
          if (Array.isArray(catalogResponse)) {
            for (const book of catalogResponse) {
              if (book.isbn && book.title) {
                bookTitles.set(book.isbn, book.title);
              }
            }
          }
        } catch {
          logger.warn('CrossServiceClient: Could not fetch catalog titles');
        }
      }

      const result: TopBorrowedBook[] = sorted.map(([isbn, count]) => ({
        bookId: isbn,
        title: bookTitles.get(isbn) || `Libro ISBN: ${isbn}`,
        borrowCount: count
      }));

      return result.length > 0 ? result : null;
    } catch (err) {
      logger.warn('CrossServiceClient.getTopBorrowedBooks failed:', err);
      return null;
    }
  }

  /**
   * Get REAL active users count from loan-service (unique userIds with loans).
   */
  async getActiveUsersCount(): Promise<number | null> {
    try {
      const url = this.loanServiceUrl
        ? `http://${this.loanServiceUrl}/api/loans/?limit=5000&page=1`
        : '';
      if (!url) return null;

      const response = await this.httpGet(url) as { data?: Array<{ userId?: string }>; total?: number } | null;
      if (!response || !response.data || !Array.isArray(response.data)) return null;

      // Count unique userIds - this IS the real "active users" count
      const userIds = new Set<string>();
      for (const loan of response.data) {
        if (loan.userId) userIds.add(loan.userId);
      }

      return userIds.size > 0 ? userIds.size : null;
    } catch (err) {
      logger.warn('CrossServiceClient.getActiveUsersCount failed:', err);
      return null;
    }
  }

  /**
   * Get REAL fine revenue data from fine-service.
   */
  async getFineRevenueSummary(): Promise<FineRevenueSummary | null> {
    try {
      const url = this.fineServiceUrl
        ? `http://${this.fineServiceUrl}/api/fines/`
        : '';
      if (!url) return null;

      const fines = await this.httpGet(url) as Array<{ amount?: number; status?: string }> | null;
      if (!Array.isArray(fines)) return null;

      let totalRevenue = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let pendingAmount = 0;

      for (const fine of fines) {
        const amount = Number(fine.amount || 0);
        if (fine.status === 'PAID') {
          totalRevenue += amount;
          paidCount++;
        } else {
          pendingAmount += amount;
          pendingCount++;
        }
      }

      return { totalRevenue, paidCount, pendingCount, pendingAmount };
    } catch (err) {
      logger.warn('CrossServiceClient.getFineRevenueSummary failed:', err);
      return null;
    }
  }

  /**
   * Get the total number of loans from loan-service.
   */
  async getTotalLoansCount(): Promise<number | null> {
    try {
      const url = this.loanServiceUrl
        ? `http://${this.loanServiceUrl}/api/loans/?limit=1&page=1`
        : '';
      if (!url) return null;

      const response = await this.httpGet(url) as { total?: number } | null;
      return response?.total ?? null;
    } catch {
      return null;
    }
  }
}
