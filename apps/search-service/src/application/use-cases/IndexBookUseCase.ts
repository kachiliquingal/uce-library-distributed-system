import { SearchRepository } from '../../domain/repositories/SearchRepository';
import { SearchableBook } from '../../domain/entities/SearchableBook';

export class IndexBookUseCase {
  constructor(private readonly searchRepository: SearchRepository) {}

  async execute(bookData: any): Promise<void> {
    if (!bookData || !bookData.isbn) {
      throw new Error('Invalid book data for indexing');
    }

    const searchableBook: SearchableBook = {
      isbn: bookData.isbn,
      title: bookData.title,
      author: bookData.author,
      description: bookData.description || '',
      category: bookData.category,
      publishedYear: bookData.publishedYear,
      indexedAt: new Date().toISOString()
    };

    await this.searchRepository.indexBook(searchableBook);
  }
}
