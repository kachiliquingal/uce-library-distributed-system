import { Book } from "../../domain/entities/Book";
import { BookRepository } from "../../domain/ports/BookRepository";

export class CreateBookUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(bookData: Book): Promise<Book> {
    // Validate business rule: No two books can have the same ISBN
    const existingBook = await this.bookRepository.findByIsbn(bookData.isbn);
    if (existingBook) {
      throw new Error("A book with this ISBN already exists in the catalog");
    }

    // Force the book to be entered as available by default
    const newBook = { ...bookData, available: true };
    const savedBook = await this.bookRepository.save(newBook);

    // Emit event to Kafka
    await import("../../infrastructure/kafka/KafkaProducer").then((m) =>
      m.KafkaProducer.getInstance().emitEvent("book.added", "BookAdded", savedBook)
    );

    return savedBook;
  }
}
