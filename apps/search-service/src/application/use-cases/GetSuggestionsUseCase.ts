import { SearchRepository } from '../../domain/repositories/SearchRepository';

export class GetSuggestionsUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(prefix: string): Promise<string[]> {
    if (!prefix || prefix.trim().length < 2) {
      return [];
    }
    return this.searchRepository.suggest(prefix.trim());
  }
}
