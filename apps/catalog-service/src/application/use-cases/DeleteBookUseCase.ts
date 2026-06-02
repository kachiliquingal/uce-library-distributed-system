import { BookRepository } from "../../domain/ports/BookRepository";

export class DeleteBookUseCase {
  constructor(private readonly bookRepository: BookRepository) {}

  async execute(id: string): Promise<boolean> {
    const isDeleted = await this.bookRepository.delete(id);

    if (!isDeleted) {
      throw new Error(`Cannot delete: Book with id ${id} not found`);
    }

    return isDeleted;
  }
}
