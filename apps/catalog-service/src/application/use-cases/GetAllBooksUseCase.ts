import { Book } from "../../domain/entities/Book";
import { BookRepository } from "../../domain/ports/BookRepository";

export class GetAllBooksUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(): Promise<Book[]> {
    return this.bookRepository.findAll();
  }
}
