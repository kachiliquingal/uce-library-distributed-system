import { SearchableBook } from '../entities/SearchableBook';

export interface SearchResult {
  hits: SearchableBook[];
  total: number;
  page: number;
  limit: number;
}
