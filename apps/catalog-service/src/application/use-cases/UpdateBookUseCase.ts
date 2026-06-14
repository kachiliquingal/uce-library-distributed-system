import { Book } from "../../domain/entities/Book";
import { BookRepository } from "../../domain/ports/BookRepository";

export class UpdateBookUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(id: string, bookData: Partial<Book>): Promise<Book> {
    // Here we could add business rules, for example:
    // Do not allow changes to the ISBN once it has been created.
    if (bookData.isbn) {
      throw new Error("ISBN cannot be modified after creation");
    }

    const updatedBook = await this.bookRepository.update(id, bookData);

    if (!updatedBook) {
      throw new Error(`Book with id ${id} not found in the catalog`);
    }

    // Emit event to Kafka
    await import("../../infrastructure/kafka/KafkaProducer").then((m) =>
      m.KafkaProducer.getInstance().emitEvent("book.updated", "BookUpdated", updatedBook)
    );

    return updatedBook;
  }
}
