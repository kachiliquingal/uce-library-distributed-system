import { SearchBooksUseCase } from "../src/application/use-cases/SearchBooksUseCase";
import { GetSuggestionsUseCase } from "../src/application/use-cases/GetSuggestionsUseCase";
import { IndexBookUseCase } from "../src/application/use-cases/IndexBookUseCase";
import { SearchRepository } from "../src/domain/repositories/SearchRepository";
import { SearchableBook } from "../src/domain/entities/SearchableBook";
import { SearchResult } from "../src/domain/value-objects/SearchResult";

class MockSearchRepository implements SearchRepository {
  public books: SearchableBook[] = [];

  async indexBook(book: SearchableBook): Promise<void> {
    this.books.push(book);
  }
  async updateBook(isbn: string, bookData: Partial<SearchableBook>): Promise<void> {
    const index = this.books.findIndex(b => b.isbn === isbn);
    if (index !== -1) {
      this.books[index] = { ...this.books[index], ...bookData };
    }
  }
  async search(query: string, page: number, limit: number): Promise<SearchResult> {
    const hits = this.books.filter(b => 
      b.title.toLowerCase().includes(query.toLowerCase()) || 
      b.author.toLowerCase().includes(query.toLowerCase())
    );
    return {
      hits,
      total: hits.length,
      page,
      limit
    };
  }
  async suggest(prefix: string): Promise<string[]> {
    const suggestions = this.books
      .filter(b => b.title.toLowerCase().startsWith(prefix.toLowerCase()))
      .map(b => b.title);
    return Array.from(new Set(suggestions));
  }
}

const sampleBook = {
  isbn: "123-456",
  title: "Clean Code",
  author: "Robert C. Martin",
  description: "A Handbook of Agile Software Craftsmanship",
  category: "Software Engineering",
  publishedYear: 2008
};

describe("Search Service Unit Tests", () => {
  test("SearchBooksUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);
    const searchBooks = new SearchBooksUseCase(repo);

    await indexBook.execute(sampleBook);

    await expect(searchBooks.execute("")).rejects.toThrow("Search query cannot be empty");

    const result = await searchBooks.execute("Clean");
    expect(result.hits.length).toBe(1);
    expect(result.hits[0].title).toBe("Clean Code");
  });

  test("GetSuggestionsUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);
    const getSuggestions = new GetSuggestionsUseCase(repo);

    await indexBook.execute(sampleBook);
    await indexBook.execute({ ...sampleBook, isbn: "222", title: "Clean Architecture" });

    const resultEmpty = await getSuggestions.execute("");
    expect(resultEmpty.length).toBe(0);

    const suggestions = await getSuggestions.execute("Cle");
    expect(suggestions.length).toBe(2);
    expect(suggestions.includes("Clean Code")).toBe(true);
    expect(suggestions.includes("Clean Architecture")).toBe(true);
  });

  test("IndexBookUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);

    await expect(indexBook.execute({ title: "No ISBN" })).rejects.toThrow("Invalid book data for indexing");

    await indexBook.execute(sampleBook);
    expect(repo.books.length).toBe(1);
    expect(repo.books[0].indexedAt).toBeDefined();
  });
});
