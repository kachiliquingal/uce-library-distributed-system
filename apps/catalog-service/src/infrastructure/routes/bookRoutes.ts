import { Router } from "express";
import { BookController } from "../controllers/BookController";
import { MongoBookRepository } from "../adapters/MongoBookRepository";
import { CreateBookUseCase } from "../../application/use-cases/CreateBookUseCase";
import { GetAllBooksUseCase } from "../../application/use-cases/GetAllBooksUseCase";
import { UpdateBookUseCase } from "../../application/use-cases/UpdateBookUseCase";
import { DeleteBookUseCase } from "../../application/use-cases/DeleteBookUseCase";

const router = Router();

// Dependency Injection (Wiring)
const bookRepository = new MongoBookRepository();
const createBookUseCase = new CreateBookUseCase(bookRepository);
const getAllBooksUseCase = new GetAllBooksUseCase(bookRepository);
const updateBookUseCase = new UpdateBookUseCase(bookRepository);
const deleteBookUseCase = new DeleteBookUseCase(bookRepository);

const bookController = new BookController(
  createBookUseCase,
  getAllBooksUseCase,
  updateBookUseCase,
  deleteBookUseCase,
);

// Definition of Endpoints
router.post("/", (req, res) => bookController.createBook(req, res));
router.get("/", (req, res) => bookController.getAllBooks(req, res));
router.put("/:id", (req, res) => bookController.updateBook(req, res));
router.delete("/:id", (req, res) => bookController.deleteBook(req, res));

export default router;
