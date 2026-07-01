import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchableBook } from '../../domain/entities/SearchableBook';

export class UpdateBookIndexUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(isbn: string, updateData: Partial<SearchableBook>): Promise<void> {
    if (!isbn) {
      throw new Error('ISBN is required to update index');
    }

    await this.searchRepository.updateBook(isbn, updateData);
  }
}
