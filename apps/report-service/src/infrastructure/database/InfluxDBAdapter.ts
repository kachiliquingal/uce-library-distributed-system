import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { IReportRepository } from '../../domain/IReportRepository';
import { ReportMetric, DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from '../../domain/ReportMetric';
import { CrossServiceClient } from './CrossServiceClient';
import { logger } from '../../utils/logger';

/**
 * Hybrid data adapter: queries REAL microservices first, falls back to InfluxDB for time-series.
 * NEVER returns fake hardcoded data. Returns empty arrays/zeros when no data is available.
 */
export class InfluxDBAdapter implements IReportRepository {
  private influxDB: InfluxDB;
  private url: string;
  private token: string;
  private org: string;
  private bucket: string;
  private crossService: CrossServiceClient;
  private influxAvailable: boolean = true;

  constructor() {
    this.url = process.env.INFLUXDB_URL || 'http://localhost:8086';
    this.token = process.env.INFLUXDB_TOKEN || 'uce_library_admin_token_secret_123';
    this.org = process.env.INFLUXDB_ORG || 'uce_library';
    this.bucket = process.env.INFLUXDB_BUCKET || 'reports';

    this.influxDB = new InfluxDB({ url: this.url, token: this.token });
    this.crossService = new CrossServiceClient();
    logger.info(`InfluxDBAdapter initialized (hybrid): InfluxDB=[${this.url}] + CrossServiceClient`);
  }

  async saveMetric(metric: ReportMetric): Promise<void> {
    try {
      const writeApi = this.influxDB.getWriteApi(this.org, this.bucket, 'ns');
      const point = new Point(metric.measurement);

      for (const [key, value] of Object.entries(metric.tags || {})) {
        if (value !== undefined && value !== null) {
          point.tag(key, String(value));
        }
      }

      for (const [key, value] of Object.entries(metric.fields || {})) {
        if (value !== undefined && value !== null) {
          if (typeof value === 'number') {
            point.floatField(key, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(key, value);
          } else {
            point.stringField(key, String(value));
          }
        }
      }

      if (metric.timestamp) {
        point.timestamp(metric.timestamp);
      }

      writeApi.writePoint(point);
      await writeApi.close();
    } catch (error) {
      logger.error('Error writing point to InfluxDB:', error);
    }
  }

  /**
   * Wraps an InfluxDB query in a timeout. Returns null if it takes too long.
   */
  private influxQueryWithTimeout<T>(queryFn: () => Promise<T>, timeoutMs = 5000): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        logger.warn(`InfluxDB query timed out after ${timeoutMs}ms`);
        this.influxAvailable = false;
        resolve(null);
      }, timeoutMs);

      queryFn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          logger.warn('InfluxDB query error:', err?.message || err);
          resolve(null);
        });
    });
  }

  async getLoansPerDay(days = 7): Promise<DailyLoanCount[]> {
    // Strategy 1: Try CrossServiceClient (REAL data from loan-service)
    try {
      const realData = await this.crossService.getLoansPerDay(days);
      if (realData && realData.length > 0) {
        logger.info(`getLoansPerDay: Got ${realData.length} data points from loan-service (REAL)`);
        return realData;
      }
    } catch (err) {
      logger.warn('CrossService getLoansPerDay failed:', err);
    }

    // Strategy 2: Try InfluxDB (time-series data from Kafka events)
    if (this.influxAvailable) {
      const influxResult = await this.influxQueryWithTimeout(async () => {
        const queryApi = this.influxDB.getQueryApi(this.org);
        const query = `
          from(bucket: "${this.bucket}")
            |> range(start: -${days}d)
            |> filter(fn: (r) => r._measurement == "loans" and r._field == "count")
            |> aggregateWindow(every: 1d, fn: sum, createEmpty: true)
        `;
        const results: DailyLoanCount[] = [];
        await new Promise<void>((resolve) => {
          queryApi.queryRows(query, {
            next: (row, tableMeta) => {
              const o = tableMeta.toObject(row);
              if (o._time) {
                results.push({
                  date: String(o._time).split('T')[0],
                  count: Number(o._value || 0)
                });
              }
            },
            error: (error) => {
              logger.warn('InfluxDB getLoansPerDay query error:', error?.message);
              resolve();
            },
            complete: () => resolve()
          });
        });
        return results;
      });

      if (influxResult && influxResult.length > 0 && influxResult.some(r => r.count > 0)) {
        logger.info(`getLoansPerDay: Got ${influxResult.length} data points from InfluxDB`);
        return influxResult;
      }
    }

    // Strategy 3: Return empty array with date structure (NO fake data)
    logger.info('getLoansPerDay: No real data available, returning empty date range');
    const emptyData: DailyLoanCount[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      emptyData.push({ date: d.toISOString().split('T')[0], count: 0 });
    }
    return emptyData;
  }

  async getTopBorrowedBooks(limit = 5): Promise<TopBorrowedBook[]> {
    // Strategy 1: Try CrossServiceClient (REAL data)
    try {
      const realData = await this.crossService.getTopBorrowedBooks(limit);
      if (realData && realData.length > 0) {
        logger.info(`getTopBorrowedBooks: Got ${realData.length} books from loan-service (REAL)`);
        return realData;
      }
    } catch (err) {
      logger.warn('CrossService getTopBorrowedBooks failed:', err);
    }

    // Strategy 2: Try InfluxDB
    if (this.influxAvailable) {
      const influxResult = await this.influxQueryWithTimeout(async () => {
        const queryApi = this.influxDB.getQueryApi(this.org);
        const query = `
          from(bucket: "${this.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "loans" and r._field == "count")
            |> group(columns: ["bookId", "title"])
            |> sum()
            |> sort(columns: ["_value"], desc: true)
            |> limit(n: ${limit})
        `;
        const results: TopBorrowedBook[] = [];
        await new Promise<void>((resolve) => {
          queryApi.queryRows(query, {
            next: (row, tableMeta) => {
              const o = tableMeta.toObject(row);
              results.push({
                bookId: String(o.bookId || 'unknown'),
                title: String(o.title || `Libro #${o.bookId}`),
                borrowCount: Number(o._value || 1)
              });
            },
            error: () => resolve(),
            complete: () => resolve()
          });
        });
        return results;
      });

      if (influxResult && influxResult.length > 0) {
        return influxResult;
      }
    }

    // Strategy 3: Return empty array (NO fake data)
    logger.info('getTopBorrowedBooks: No real data available');
    return [];
  }

  async getActiveUsersCount(_days = 30): Promise<number> {
    // Strategy 1: Try CrossServiceClient (REAL unique users from loan-service)
    try {
      const realCount = await this.crossService.getActiveUsersCount();
      if (realCount !== null && realCount > 0) {
        logger.info(`getActiveUsersCount: Got ${realCount} real unique users from loan-service`);
        return realCount;
      }
    } catch (err) {
      logger.warn('CrossService getActiveUsersCount failed:', err);
    }

    // Strategy 2: Try InfluxDB
    if (this.influxAvailable) {
      const influxResult = await this.influxQueryWithTimeout(async () => {
        const queryApi = this.influxDB.getQueryApi(this.org);
        const query = `
          from(bucket: "${this.bucket}")
            |> range(start: -30d)
            |> filter(fn: (r) => r._measurement == "user_activity")
            |> group(columns: ["userId"])
            |> count()
            |> group()
            |> count()
        `;
        let count = 0;
        await new Promise<void>((resolve) => {
          queryApi.queryRows(query, {
            next: (row, tableMeta) => {
              const o = tableMeta.toObject(row);
              count = Number(o._value || 0);
            },
            error: () => resolve(),
            complete: () => resolve()
          });
        });
        return count;
      });

      if (influxResult !== null && influxResult > 0) {
        return influxResult;
      }
    }

    // Strategy 3: Return 0 (NO fake data)
    return 0;
  }

  async getFineRevenueSummary(): Promise<FineRevenueSummary> {
    // Strategy 1: Try CrossServiceClient (REAL fine data from fine-service)
    try {
      const realData = await this.crossService.getFineRevenueSummary();
      if (realData !== null) {
        logger.info(`getFineRevenueSummary: Got real fine data - paid=${realData.paidCount}, pending=${realData.pendingCount}`);
        return realData;
      }
    } catch (err) {
      logger.warn('CrossService getFineRevenueSummary failed:', err);
    }

    // Strategy 2: Try InfluxDB
    if (this.influxAvailable) {
      const influxResult = await this.influxQueryWithTimeout(async () => {
        const queryApi = this.influxDB.getQueryApi(this.org);
        const query = `
          from(bucket: "${this.bucket}")
            |> range(start: -365d)
            |> filter(fn: (r) => r._measurement == "fines")
        `;
        let totalRevenue = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let pendingAmount = 0;

        await new Promise<void>((resolve) => {
          queryApi.queryRows(query, {
            next: (row, tableMeta) => {
              const o = tableMeta.toObject(row);
              const amount = Number(o._value || 0);
              if (o.status === 'PAID') {
                totalRevenue += amount;
                paidCount += 1;
              } else {
                pendingAmount += amount;
                pendingCount += 1;
              }
            },
            error: () => resolve(),
            complete: () => resolve()
          });
        });

        if (paidCount > 0 || pendingCount > 0) {
          return { totalRevenue, paidCount, pendingCount, pendingAmount };
        }
        return null;
      });

      if (influxResult) {
        return influxResult;
      }
    }

    // Strategy 3: Return zeros (NO fake data)
    return { totalRevenue: 0, paidCount: 0, pendingCount: 0, pendingAmount: 0 };
  }
}
