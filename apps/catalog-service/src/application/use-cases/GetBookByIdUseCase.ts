import { Book } from "../../domain/entities/Book";
import { BookRepository } from "../../domain/ports/BookRepository";

export class GetBookByIdUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  public async execute(id: string): Promise<Book | null> {
    return await this.bookRepository.findById(id);
  }
}
