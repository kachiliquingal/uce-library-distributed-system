import { SearchBooksUseCase } from "../src/application/use-cases/SearchBooksUseCase";
import { GetSuggestionsUseCase } from "../src/application/use-cases/GetSuggestionsUseCase";
import { IndexBookUseCase } from "../src/application/use-cases/IndexBookUseCase";
import { SearchRepository } from "../src/domain/repositories/SearchRepository";
import { SearchableBook } from "../src/domain/entities/SearchableBook";
import { SearchResult } from "../src/domain/value-objects/SearchResult";

// --- In-Memory Mock ---

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

// --- Test Runner ---

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

async function assertThrows(fn: () => Promise<unknown>, expectedMessage: string, testName: string): Promise<void> {
  try {
    await fn();
    console.error(`  ❌ ${testName} (expected error but none was thrown)`);
    failed++;
  } catch (error: any) {
    if (error.message === expectedMessage) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ ${testName} (expected: "${expectedMessage}", got: "${error.message}")`);
      failed++;
    }
  }
}

// --- Sample Data ---
const sampleBook = {
  isbn: "123-456",
  title: "Clean Code",
  author: "Robert C. Martin",
  description: "A Handbook of Agile Software Craftsmanship",
  category: "Software Engineering",
  publishedYear: 2008
};

// --- Tests ---

async function testSearchBooksUseCase(): Promise<void> {
  console.log("\n📋 SearchBooksUseCase Tests:");
  
  const repo = new MockSearchRepository();
  const indexBook = new IndexBookUseCase(repo);
  const searchBooks = new SearchBooksUseCase(repo);

  await indexBook.execute(sampleBook);

  // Test 1: Empty Query
  await assertThrows(
    () => searchBooks.execute(""),
    "Search query cannot be empty",
    "Should throw if query is empty"
  );

  // Test 2: Valid Search
  const result = await searchBooks.execute("Clean");
  assert(result.hits.length === 1, "Should return matching books");
  assert(result.hits[0].title === "Clean Code", "Should match the correct book");
}

async function testGetSuggestionsUseCase(): Promise<void> {
  console.log("\n📋 GetSuggestionsUseCase Tests:");
  
  const repo = new MockSearchRepository();
  const indexBook = new IndexBookUseCase(repo);
  const getSuggestions = new GetSuggestionsUseCase(repo);

  await indexBook.execute(sampleBook);
  await indexBook.execute({ ...sampleBook, isbn: "222", title: "Clean Architecture" });

  // Test 1: Empty Prefix
  const resultEmpty = await getSuggestions.execute("");
  assert(resultEmpty.length === 0, "Should return empty for short prefix");

  // Test 2: Valid Prefix
  const suggestions = await getSuggestions.execute("Cle");
  assert(suggestions.length === 2, "Should return matching suggestions");
  assert(suggestions.includes("Clean Code") && suggestions.includes("Clean Architecture"), "Should return correct suggestions");
}

async function testIndexBookUseCase(): Promise<void> {
  console.log("\n📋 IndexBookUseCase Tests:");
  
  const repo = new MockSearchRepository();
  const indexBook = new IndexBookUseCase(repo);

  // Test 1: Invalid Data
  await assertThrows(
    () => indexBook.execute({ title: "No ISBN" }),
    "Invalid book data for indexing",
    "Should throw if ISBN is missing"
  );

  // Test 2: Valid Data
  await indexBook.execute(sampleBook);
  assert(repo.books.length === 1, "Should index the book");
  assert(repo.books[0].indexedAt !== undefined, "Should add indexedAt timestamp");
}

// --- Main ---

async function main(): Promise<void> {
  console.log("🧪 Search Service - Unit Tests\n" + "=".repeat(40));

  await testSearchBooksUseCase();
  await testGetSuggestionsUseCase();
  await testIndexBookUseCase();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
