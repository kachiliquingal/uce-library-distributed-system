import request from "supertest";
import express from "express";
import { createSearchRoutes } from "../../apps/search-service/src/infrastructure/http/routes";
import { SearchBooksUseCase } from "../../apps/search-service/src/application/use-cases/SearchBooksUseCase";
import { GetSuggestionsUseCase } from "../../apps/search-service/src/application/use-cases/GetSuggestionsUseCase";
import { SearchableBook } from "../../apps/search-service/src/domain/entities/SearchableBook";

let mockIndexedBooks: SearchableBook[] = [];

class MockSearchRepository {
  async indexBook(book: SearchableBook): Promise<void> {
    mockIndexedBooks.push(book);
  }
  async updateBook(isbn: string, book: Partial<SearchableBook>): Promise<void> {
    const found = mockIndexedBooks.find((b) => b.isbn === isbn);
    if (found) Object.assign(found, book);
  }
  async search(query: string, page: number, limit: number) {
    const lower = query.toLowerCase();
    const hits = mockIndexedBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower) ||
        b.isbn.includes(lower) ||
        (b.description && b.description.toLowerCase().includes(lower))
    );
    return {
      hits: hits.slice((page - 1) * limit, page * limit),
      total: hits.length,
      page,
      limit,
    };
  }
  async suggest(prefix: string): Promise<string[]> {
    const lower = prefix.toLowerCase();
    return mockIndexedBooks
      .filter((b) => b.title.toLowerCase().startsWith(lower))
      .map((b) => b.title);
  }
}

describe("Search Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;
  let mockRepo: MockSearchRepository;

  beforeEach(() => {
    mockIndexedBooks = [
      {
        isbn: "978-0132350884",
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Software Engineering",
        description: "A Handbook of Agile Software Craftsmanship",
        indexedAt: new Date().toISOString(),
      },
      {
        isbn: "978-1449373320",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        category: "Distributed Systems",
        description: "The big ideas behind reliable, scalable, and maintainable systems",
        indexedAt: new Date().toISOString(),
      },
    ];
    mockRepo = new MockSearchRepository();
    const searchUseCase = new SearchBooksUseCase(mockRepo);
    const suggestionsUseCase = new GetSuggestionsUseCase(mockRepo);

    app = express();
    app.use(express.json());
    app.use("/api/search", createSearchRoutes(searchUseCase, suggestionsUseCase));
  });

  test("GET /api/search - Should search books by query string", async () => {
    const res = await request(app).get("/api/search?q=Clean");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hits.length).toBe(1);
    expect(res.body.data.hits[0].title).toBe("Clean Code");
  });

  test("GET /api/search - Should search books by author name", async () => {
    const res = await request(app).get("/api/search?q=Kleppmann");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hits.length).toBe(1);
    expect(res.body.data.hits[0].title).toBe("Designing Data-Intensive Applications");
  });

  test("GET /api/search - Should return 400 when query parameter 'q' is missing", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Query parameter "q" is required');
  });

  test("GET /api/search/suggestions - Should return autocomplete suggestions for prefix", async () => {
    const res = await request(app).get("/api/search/suggestions?prefix=De");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain("Designing Data-Intensive Applications");
  });

  test("GET /api/search/suggestions - Should return 400 when prefix is missing", async () => {
    const res = await request(app).get("/api/search/suggestions");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Query parameter "prefix" is required');
  });
});
