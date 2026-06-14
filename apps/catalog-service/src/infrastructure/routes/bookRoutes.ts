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

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new book
 *     tags: [Catalog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book created successfully
 */
router.post("/", (req, res) => bookController.createBook(req, res));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get all books
 *     tags: [Catalog]
 *     responses:
 *       200:
 *         description: List of all books
 */
router.get("/", (req, res) => bookController.getAllBooks(req, res));

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 */
router.put("/:id", (req, res) => bookController.updateBook(req, res));

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted successfully
 */
router.delete("/:id", (req, res) => bookController.deleteBook(req, res));

export default router;
