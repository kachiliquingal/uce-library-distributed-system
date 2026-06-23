import { Router, Request, Response } from 'express';
import { LoanRepositoryImpl } from '../mysql/LoanRepositoryImpl';
import { BorrowBookUseCase, ReturnBookUseCase, GetLoansUseCase } from '../../application/use-cases/LoanUseCases';

const router = Router();
const repository = new LoanRepositoryImpl();
const borrowUseCase = new BorrowBookUseCase(repository);
const returnUseCase = new ReturnBookUseCase(repository);
const getUseCase = new GetLoansUseCase(repository);

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Request a loan for a book (Checkout)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               isbn:
 *                 type: string
 *     responses:
 *       201:
 *         description: Loan created successfully
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, isbn } = req.body;
    const loan = await borrowUseCase.execute(userId, isbn);
    res.status(201).json(loan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/loans/{id}/return:
 *   put:
 *     summary: Return a borrowed book
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book returned successfully
 */
router.put('/:id/return', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const loan = await returnUseCase.execute(id);
    res.json(loan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/loans/user/{userId}:
 *   get:
 *     summary: Get all loans for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of user loans
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await getUseCase.getByUser(userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get all loans (Admin)
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of all loans
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    let result;
    if (activeOnly) {
      result = await getUseCase.getAllActive(page, limit);
    } else {
      result = await getUseCase.getAll(page, limit);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as loanRouter };
