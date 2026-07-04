import { Router } from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import { InfluxDBAdapter } from '../../database/InfluxDBAdapter';
import { AnalyticsUseCase } from '../../../application/use-cases/AnalyticsUseCase';
import { ReportController } from '../controllers/ReportController';
import { buildGraphQLSchema, buildGraphQLRoot } from '../../graphql/schema';

const router = Router();
const influxAdapter = new InfluxDBAdapter();
export const analyticsUseCase = new AnalyticsUseCase(influxAdapter);
const controller = new ReportController(analyticsUseCase);

// GraphQL Endpoint
router.all('/graphql', createHandler({
  schema: buildGraphQLSchema(),
  rootValue: buildGraphQLRoot(analyticsUseCase)
}));

/**
 * @swagger
 * /summary:
 *   get:
 *     summary: Get full analytics dashboard summary
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Dashboard summary data
 */
router.get('/summary', (req, res) => controller.getSummary(req, res));

/**
 * @swagger
 * /loans-per-day:
 *   get:
 *     summary: Get loans count grouped by day
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days to retrieve
 *     responses:
 *       200:
 *         description: Array of daily loan counts
 */
router.get('/loans-per-day', (req, res) => controller.getLoansPerDay(req, res));

/**
 * @swagger
 * /top-books:
 *   get:
 *     summary: Get top borrowed books
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of books returned
 *     responses:
 *       200:
 *         description: Array of top borrowed books
 */
router.get('/top-books', (req, res) => controller.getTopBorrowedBooks(req, res));

/**
 * @swagger
 * /active-users:
 *   get:
 *     summary: Get count of active users
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Active users count
 */
router.get('/active-users', (req, res) => controller.getActiveUsersCount(req, res));

/**
 * @swagger
 * /fine-revenue:
 *   get:
 *     summary: Get fine revenue summary
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Fine revenue statistics
 */
router.get('/fine-revenue', (req, res) => controller.getFineRevenueSummary(req, res));

/**
 * @swagger
 * /record:
 *   post:
 *     summary: Record a custom analytics metric
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - measurement
 *             properties:
 *               measurement:
 *                 type: string
 *               tags:
 *                 type: object
 *               fields:
 *                 type: object
 *     responses:
 *       201:
 *         description: Metric recorded
 */
router.post('/record', (req, res) => controller.recordEvent(req, res));

export default router;
