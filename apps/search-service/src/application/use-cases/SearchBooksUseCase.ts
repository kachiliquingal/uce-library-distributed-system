import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchResult } from '../../domain/value-objects/SearchResult';

export class SearchBooksUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(query: string, page: number = 1, limit: number = 10): Promise<SearchResult> {
    if (!query || query.trim() === '') {
      throw new Error('Search query cannot be empty');
    }
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    return this.searchRepository.search(query.trim(), page, limit);
  }
}
