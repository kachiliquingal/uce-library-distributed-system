import { Client } from '@elastic/elasticsearch';
import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchableBook } from '../../domain/entities/SearchableBook';
import { SearchResult } from '../../domain/value-objects/SearchResult';
import { logger } from '../../utils/logger';

export class ElasticsearchSearchRepository implements SearchRepository {
  private client: Client;
  private readonly indexName = 'books';

  constructor() {
    const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    this.client = new Client({ node });
  }

  public async initializeIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({ index: this.indexName });
      if (!indexExists) {
        logger.info(`[Elasticsearch] Creating index '${this.indexName}'...`);
        await this.client.indices.create({
          index: this.indexName,
          body: {
            settings: {
              analysis: {
                analyzer: {
                  autocomplete_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'autocomplete_filter']
                  }
                },
                filter: {
                  autocomplete_filter: {
                    type: 'edge_ngram',
                    min_gram: 2,
                    max_gram: 20
                  }
                }
              }
            },
            mappings: {
              properties: {
                isbn: { type: 'keyword' },
                title: { 
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'standard'
                },
                author: { type: 'text' },
                description: { type: 'text' },
                category: { type: 'keyword' },
                publishedYear: { type: 'integer' },
                indexedAt: { type: 'date' }
              }
            }
          }
        });
        logger.info(`[Elasticsearch] Index '${this.indexName}' created successfully.`);
      } else {
        logger.info(`[Elasticsearch] Index '${this.indexName}' already exists.`);
      }
    } catch (error) {
      logger.error(`[Elasticsearch] Error initializing index:`, error);
    }
  }

  async indexBook(book: SearchableBook): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: book.isbn, // use ISBN as document ID to prevent duplicates
        document: book
      });
      logger.info(`[Elasticsearch] Indexed book: ${book.isbn} - ${book.title}`);
    } catch (error) {
      logger.error(`[Elasticsearch] Error indexing book ${book.isbn}:`, error);
      throw error;
    }
  }

  async updateBook(isbn: string, book: Partial<SearchableBook>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id: isbn,
        doc: book
      });
      logger.info(`[Elasticsearch] Updated book: ${isbn}`);
    } catch (error) {
      // If it fails because the document doesn't exist, we might want to index it fully.
      // But for now, we just log and throw.
      logger.error(`[Elasticsearch] Error updating book ${isbn}:`, error);
      throw error;
    }
  }

  async search(query: string, page: number, limit: number): Promise<SearchResult> {
    const from = (page - 1) * limit;
    
    try {
      const response = await this.client.search({
        index: this.indexName,
        from,
        size: limit,
        body: {
          query: {
            multi_match: {
              query,
              fields: ['title^3', 'author^2', 'isbn', 'description'], // Give more weight to title and author
              fuzziness: 'AUTO' // Tolerate typos
            }
          }
        }
      });

      const hits = response.hits.hits.map((hit: any) => hit._source as SearchableBook);
      // Determine total correctly depending on ES version response structure
      const total = typeof response.hits.total === 'number' 
          ? response.hits.total 
          : (response.hits.total as any).value;

      return {
        hits,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error(`[Elasticsearch] Search error for query '${query}':`, error);
      throw error;
    }
  }

  async suggest(prefix: string): Promise<string[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        size: 5,
        _source: ['title'],
        body: {
          query: {
            match_phrase_prefix: {
              title: {
                query: prefix
              }
            }
          }
        }
      });

      const suggestions = response.hits.hits.map((hit: any) => hit._source.title as string);
      // Remove duplicates
      return Array.from(new Set(suggestions));
    } catch (error) {
      logger.error(`[Elasticsearch] Suggest error for prefix '${prefix}':`, error);
      return [];
    }
  }
}
