import { Book } from "../entities/Book";

export interface BookRepository {
  save(book: Book): Promise<Book>;
  findAll(): Promise<Book[]>;
  findByIsbn(isbn: string): Promise<Book | null>;
  findById(id: string): Promise<Book | null>;
  findAllAuthors(): Promise<string[]>;
  update(id: string, book: Partial<Book>): Promise<Book | null>;
  delete(id: string): Promise<boolean>;
}
