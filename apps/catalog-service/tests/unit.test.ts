import { CreateBookUseCase } from "../src/application/use-cases/CreateBookUseCase";
import { GetAllBooksUseCase } from "../src/application/use-cases/GetAllBooksUseCase";
import { UpdateBookUseCase } from "../src/application/use-cases/UpdateBookUseCase";
import { DeleteBookUseCase } from "../src/application/use-cases/DeleteBookUseCase";
import { Book } from "../src/domain/entities/Book";
import { BookRepository } from "../src/domain/ports/BookRepository";

// --- In-Memory Mock (no external dependencies needed) ---

class MockBookRepository implements BookRepository {
  private books: Book[] = [];
  private idCounter = 1;

  async save(book: Book): Promise<Book> {
    const savedBook: Book = { ...book, id: String(this.idCounter++) };
    this.books.push(savedBook);
    return savedBook;
  }

  async findAll(): Promise<Book[]> {
    return [...this.books];
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.books.find((b) => b.isbn === isbn) || null;
  }

  async findById(id: string): Promise<Book | null> {
    return this.books.find((b) => b.id === id) || null;
  }

  async findAllAuthors(): Promise<string[]> {
    return Array.from(new Set(this.books.map((b) => b.author)));
  }

  async update(id: string, bookData: Partial<Book>): Promise<Book | null> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.books[index] = { ...this.books[index], ...bookData };
    return this.books[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.books.splice(index, 1);
    return true;
  }

  clear(): void {
    this.books = [];
    this.idCounter = 1;
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

const sampleBook: Book = {
  title: "Clean Architecture",
  author: "Robert C. Martin",
  isbn: "978-0134494166",
  publishedYear: 2017,
  category: "Software Engineering",
  available: false,
};

// --- Tests ---

async function testCreateBookUseCase(): Promise<void> {
  console.log("\n📋 CreateBookUseCase Tests:");

  const repo = new MockBookRepository();
  const createBook = new CreateBookUseCase(repo);

  // Test 1: Successful creation
  const book = await createBook.execute({ ...sampleBook });
  assert(book.id !== undefined, "Should assign an id to the created book");
  assert(book.title === "Clean Architecture", "Should preserve the book title");
  assert(book.isbn === "978-0134494166", "Should preserve the ISBN");
  assert(book.available === true, "Should force available to true on creation");

  // Test 2: Duplicate ISBN should throw
  await assertThrows(
    () => createBook.execute({ ...sampleBook }),
    "A book with this ISBN already exists in the catalog",
    "Should throw error for duplicate ISBN",
  );

  // Test 3: Create a second book with different ISBN
  const book2 = await createBook.execute({
    ...sampleBook,
    title: "Domain-Driven Design",
    isbn: "978-0321125217",
  });
  assert(book2.title === "Domain-Driven Design", "Should create a second book with different ISBN");
  assert(book2.id !== book.id, "Should assign a different id to the second book");
}

async function testGetAllBooksUseCase(): Promise<void> {
  console.log("\n📋 GetAllBooksUseCase Tests:");

  const repo = new MockBookRepository();
  const createBook = new CreateBookUseCase(repo);
  const getAllBooks = new GetAllBooksUseCase(repo);

  // Test 1: Empty catalog
  const emptyBooks = await getAllBooks.execute();
  assert(emptyBooks.length === 0, "Should return empty array when no books exist");

  // Test 2: After adding books
  await createBook.execute({ ...sampleBook });
  await createBook.execute({ ...sampleBook, title: "Refactoring", isbn: "978-0201485677" });

  const allBooks = await getAllBooks.execute();
  assert(allBooks.length === 2, "Should return all books in the catalog");
}

async function testUpdateBookUseCase(): Promise<void> {
  console.log("\n📋 UpdateBookUseCase Tests:");

  const repo = new MockBookRepository();
  const createBook = new CreateBookUseCase(repo);
  const updateBook = new UpdateBookUseCase(repo);

  const created = await createBook.execute({ ...sampleBook });

  // Test 1: Successful update
  const updated = await updateBook.execute(created.id!, { title: "Clean Architecture (Updated)" });
  assert(updated.title === "Clean Architecture (Updated)", "Should update the book title");
  assert(updated.isbn === sampleBook.isbn, "Should preserve unchanged fields");

  // Test 2: Cannot modify ISBN
  await assertThrows(
    () => updateBook.execute(created.id!, { isbn: "new-isbn" }),
    "ISBN cannot be modified after creation",
    "Should throw error when trying to modify ISBN",
  );

  // Test 3: Non-existent book should throw
  await assertThrows(
    () => updateBook.execute("non-existent-id", { title: "Test" }),
    "Book with id non-existent-id not found in the catalog",
    "Should throw error for non-existent book",
  );
}

async function testDeleteBookUseCase(): Promise<void> {
  console.log("\n📋 DeleteBookUseCase Tests:");

  const repo = new MockBookRepository();
  const createBook = new CreateBookUseCase(repo);
  const deleteBook = new DeleteBookUseCase(repo);
  const getAllBooks = new GetAllBooksUseCase(repo);

  const created = await createBook.execute({ ...sampleBook });

  // Test 1: Successful deletion
  const result = await deleteBook.execute(created.id!);
  assert(result === true, "Should return true on successful deletion");

  const remaining = await getAllBooks.execute();
  assert(remaining.length === 0, "Should have no books after deletion");

  // Test 2: Non-existent book should throw
  await assertThrows(
    () => deleteBook.execute("non-existent-id"),
    "Cannot delete: Book with id non-existent-id not found",
    "Should throw error when deleting non-existent book",
  );
}

// --- Main ---

async function main(): Promise<void> {
  console.log("🧪 Catalog Service - Unit Tests\n" + "=".repeat(40));

  await testCreateBookUseCase();
  await testGetAllBooksUseCase();
  await testUpdateBookUseCase();
  await testDeleteBookUseCase();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
