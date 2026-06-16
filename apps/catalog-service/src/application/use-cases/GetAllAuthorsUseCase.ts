import { BookRepository } from "../../domain/ports/BookRepository";

export class GetAllAuthorsUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  public async execute(): Promise<string[]> {
    return await this.bookRepository.findAllAuthors();
  }
}
