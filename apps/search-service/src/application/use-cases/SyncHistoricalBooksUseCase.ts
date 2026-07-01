import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchableBook } from '../../domain/entities/SearchableBook';
import { logger } from '../../utils/logger';

export class SyncHistoricalBooksUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(): Promise<void> {
    logger.info('[SyncHistoricalBooksUseCase] Starting initial data hydration from catalog-service...');
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      
      // Fetch all books (in a real scenario, this should be paginated if the DB is huge)
      const response = await fetch(`${catalogUrl}/api/catalog?limit=1000`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from catalog: ${response.statusText}`);
      }

      const data = await response.json();
      const books = data.data || [];

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
