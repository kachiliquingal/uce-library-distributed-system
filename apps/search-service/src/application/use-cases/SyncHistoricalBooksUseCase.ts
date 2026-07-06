import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchableBook } from '../../domain/entities/SearchableBook';
import { logger } from '../../utils/logger';
import { CircuitBreaker } from '../../utils/CircuitBreaker';

export class SyncHistoricalBooksUseCase {
  private breaker = new CircuitBreaker({ name: 'CatalogSyncHttpClient', failureThreshold: 3, resetTimeoutMs: 15000 });

  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(): Promise<void> {
    logger.info('[SyncHistoricalBooksUseCase] Starting initial data hydration from catalog-service...');
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      
      const books = await this.breaker.execute(
        async () => {
          const response = await fetch(`${catalogUrl}/api/catalog/books?limit=5000`);
          if (!response.ok) {
            throw new Error(`Failed to fetch from catalog: ${response.statusText}`);
          }
          const data = await response.json();
          return Array.isArray(data) ? data : (data.data || []);
        },
        () => {
          logger.warn('[SyncHistoricalBooksUseCase] Circuit breaker open or fetch failed. Returning empty book list fallback.');
          return [];
        }
      );

      logger.info(`[SyncHistoricalBooksUseCase] Fetched ${books.length} historical books from catalog.`);


      let syncedCount = 0;
      for (const book of books) {
        try {
          const searchableBook: SearchableBook = {
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            description: book.description || '',
            category: book.category,
            publishedYear: book.publishedYear,
            indexedAt: new Date().toISOString()
          };
          await this.searchRepository.indexBook(searchableBook);
          syncedCount++;
        } catch (err) {
          logger.warn(`[SyncHistoricalBooksUseCase] Failed to index book ${book.isbn}:`, err);
        }
      }

      logger.info(`[SyncHistoricalBooksUseCase] Hydration complete. Successfully synced ${syncedCount}/${books.length} books.`);
    } catch (error) {
      logger.error('[SyncHistoricalBooksUseCase] Critical error during initial sync:', error);
    }
  }
}
