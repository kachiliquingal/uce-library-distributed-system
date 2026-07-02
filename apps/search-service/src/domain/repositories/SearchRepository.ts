import { SearchableBook } from '../entities/SearchableBook';
import { SearchResult } from '../value-objects/SearchResult';

export interface SearchRepository {
  indexBook(book: SearchableBook): Promise<void>;
  updateBook(isbn: string, book: Partial<SearchableBook>): Promise<void>;
  search(query: string, page: number, limit: number): Promise<SearchResult>;
  suggest(prefix: string): Promise<string[]>;
}
