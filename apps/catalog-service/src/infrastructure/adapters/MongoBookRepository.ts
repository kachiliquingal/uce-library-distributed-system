import { Book } from "../../domain/entities/Book";
import { BookRepository } from "../../domain/ports/BookRepository";
import { BookModel } from "../database/BookModel";

export class MongoBookRepository implements BookRepository {
  async save(book: Book): Promise<Book> {
    const createdBook = new BookModel(book);
    const savedBook = await createdBook.save();
    return savedBook.toJSON() as Book;
  }

  async findAll(): Promise<Book[]> {
    const books = await BookModel.find();
    return books.map((book) => book.toJSON() as Book);
  }

  async findByIsbn(isbn: string): Promise<Book | null> {
    const book = await BookModel.findOne({ isbn });
    return book ? (book.toJSON() as Book) : null;
  }

  async findById(id: string): Promise<Book | null> {
    const book = await BookModel.findById(id);
    return book ? (book.toJSON() as Book) : null;
  }

  async findAllAuthors(): Promise<string[]> {
    return await BookModel.distinct("author");
  }

  async update(id: string, book: Partial<Book>): Promise<Book | null> {
    const updatedBook = await BookModel.findByIdAndUpdate(id, book, {
      new: true,
    });
    return updatedBook ? (updatedBook.toJSON() as Book) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await BookModel.findByIdAndDelete(id);
    return result !== null;
  }
}
