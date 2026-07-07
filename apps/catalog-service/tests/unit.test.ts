import { CreateBookUseCase } from "../src/application/use-cases/CreateBookUseCase";
import { GetAllBooksUseCase } from "../src/application/use-cases/GetAllBooksUseCase";
import { UpdateBookUseCase } from "../src/application/use-cases/UpdateBookUseCase";
import { DeleteBookUseCase } from "../src/application/use-cases/DeleteBookUseCase";
import { Book } from "../src/domain/entities/Book";
import { BookRepository } from "../src/domain/ports/BookRepository";

jest.mock("../src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

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

const sampleBook: Book = {
  title: "Clean Architecture",
  author: "Robert C. Martin",
  isbn: "978-0134494166",
  publishedYear: 2017,
  category: "Software Engineering",
  available: false,
};

describe("Catalog Service Unit Tests", () => {
  test("CreateBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);

    const book = await createBook.execute({ ...sampleBook });
    expect(book.id).toBeDefined();
    expect(book.title).toBe("Clean Architecture");
    expect(book.isbn).toBe("978-0134494166");
    expect(book.available).toBe(true);

    await expect(createBook.execute({ ...sampleBook })).rejects.toThrow("A book with this ISBN already exists in the catalog");

    const book2 = await createBook.execute({
      ...sampleBook,
      title: "Domain-Driven Design",
      isbn: "978-0321125217",
    });
    expect(book2.title).toBe("Domain-Driven Design");
    expect(book2.id).not.toBe(book.id);
  });

  test("GetAllBooksUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const getAllBooks = new GetAllBooksUseCase(repo);

    const emptyBooks = await getAllBooks.execute();
    expect(emptyBooks.length).toBe(0);

    await createBook.execute({ ...sampleBook });
    await createBook.execute({ ...sampleBook, title: "Refactoring", isbn: "978-0201485677" });

    const allBooks = await getAllBooks.execute();
    expect(allBooks.length).toBe(2);
  });

  test("UpdateBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const updateBook = new UpdateBookUseCase(repo);

    const created = await createBook.execute({ ...sampleBook });

    const updated = await updateBook.execute(created.id!, { title: "Clean Architecture (Updated)" });
    expect(updated.title).toBe("Clean Architecture (Updated)");
    expect(updated.isbn).toBe(sampleBook.isbn);

    await expect(updateBook.execute(created.id!, { isbn: "new-isbn" })).rejects.toThrow("ISBN cannot be modified after creation");
    await expect(updateBook.execute("non-existent-id", { title: "Test" })).rejects.toThrow("Book with id non-existent-id not found in the catalog");
  });

  test("DeleteBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const deleteBook = new DeleteBookUseCase(repo);
    const getAllBooks = new GetAllBooksUseCase(repo);

    const created = await createBook.execute({ ...sampleBook });

    const result = await deleteBook.execute(created.id!);
    expect(result).toBe(true);

    const remaining = await getAllBooks.execute();
    expect(remaining.length).toBe(0);

    await expect(deleteBook.execute("non-existent-id")).rejects.toThrow("Cannot delete: Book with id non-existent-id not found");
  });
});
