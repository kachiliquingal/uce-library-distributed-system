import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import { ManageStockUseCase } from '../../../application/use-cases/ManageStockUseCase';
import { CouchDBAdapter } from '../../database/CouchDBAdapter';
import { CatalogGrpcClient } from '../../grpc/CatalogGrpcClient';

export const inventoryRouter = Router();

// Dependency Injection Initialization
const repository = new CouchDBAdapter();
const catalogClient = new CatalogGrpcClient();
export const manageStockUseCase = new ManageStockUseCase(repository, catalogClient);
const inventoryController = new InventoryController(manageStockUseCase);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Inventory health check
 *     responses:
 *       200:
 *         description: OK
 */
inventoryRouter.get('/', (req, res) => {
  res.status(200).json({ message: 'Inventory Service API' });
});

/**
 * @swagger
 * /sync-legacy-loans:
 *   post:
 *     summary: Sync legacy loans stock to 0
 *     responses:
 *       200:
 *         description: Synced successfully
 */
inventoryRouter.post('/sync-legacy-loans', (req, res) => inventoryController.syncLegacyLoans(req, res));

/**
 * @swagger
 * /low-stock:
 *   get:
 *     summary: Get low stock books
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *         description: Stock threshold (default 5)
 *     responses:
 *       200:
 *         description: List of physical stock below threshold
 */
inventoryRouter.get('/low-stock', (req, res) => inventoryController.getLowStock(req, res));

/**
 * @swagger
 * /{isbn}:
 *   get:
 *     summary: Get stock by ISBN
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Physical stock details
 *       404:
 *         description: Not found
 */
inventoryRouter.get('/:isbn', (req, res) => inventoryController.getStock(req, res));

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create initial physical stock for a cataloged book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isbn:
 *                 type: string
 *               initialCopies:
 *                 type: integer
 *               shelfLocation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stock created
 *       400:
 *         description: Validation error or ISBN not in catalog
 */
inventoryRouter.post('/', (req, res) => inventoryController.createStock(req, res));

/**
 * @swagger
 * /{isbn}/stock:
 *   put:
 *     summary: Add more stock to an existing physical book
 *     parameters:
 *       - in: path
 *         name: isbn
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
 *               copiesToAdd:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock updated
 *       404:
 *         description: Not found
 */
inventoryRouter.put('/:isbn/stock', (req, res) => inventoryController.addStock(req, res));

