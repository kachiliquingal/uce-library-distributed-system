import { Request, Response } from "express";
import { CreateBookUseCase } from "../../application/use-cases/CreateBookUseCase";
import { GetAllBooksUseCase } from "../../application/use-cases/GetAllBooksUseCase";
import { UpdateBookUseCase } from "../../application/use-cases/UpdateBookUseCase";
import { DeleteBookUseCase } from "../../application/use-cases/DeleteBookUseCase";

export class BookController {
  constructor(
    private readonly createBookUseCase: CreateBookUseCase,
    private readonly getAllBooksUseCase: GetAllBooksUseCase,
    private readonly updateBookUseCase: UpdateBookUseCase,
    private readonly deleteBookUseCase: DeleteBookUseCase,
  ) {}

  async createBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await this.createBookUseCase.execute(req.body);
      res.status(201).json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllBooks(req: Request, res: Response): Promise<void> {
    try {
      const books = await this.getAllBooksUseCase.execute();
      res.status(200).json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedBook = await this.updateBookUseCase.execute(id, req.body);
      res.status(200).json(updatedBook);
    } catch (error: any) {
      if (error.message.includes("not found")) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  async deleteBook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteBookUseCase.execute(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}
