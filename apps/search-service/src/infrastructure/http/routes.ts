import { Router, Request, Response } from 'express';
import { SearchBooksUseCase } from '../../application/use-cases/SearchBooksUseCase';
import { GetSuggestionsUseCase } from '../../application/use-cases/GetSuggestionsUseCase';
import { logger } from '../../utils/logger';

export function createSearchRoutes(
  searchBooksUseCase: SearchBooksUseCase,
  getSuggestionsUseCase: GetSuggestionsUseCase
): Router {
  const router = Router();

  /**
   * @swagger
   * /:
   *   get:
   *     summary: Search for books
   *     description: Perform full-text search across books by title, author, description, or ISBN.
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: The search query string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Search results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     hits:
   *                       type: array
   *                       items:
   *                         type: object
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *       400:
   *         description: Bad request (missing query)
   *       500:
   *         description: Internal server error
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!q) {
        return res.status(400).json({ success: false, message: 'Query parameter "q" is required' });
      }

      const result = await searchBooksUseCase.execute(q, page, limit);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error(`[SearchRoutes] Error in GET /: ${error.message}`);
      res.status(500).json({ success: false, message: 'Internal server error during search' });
    }
  });

  /**
   * @swagger
   * /suggestions:
   *   get:
   *     summary: Get search autocomplete suggestions
   *     description: Returns a list of book titles that match the provided prefix.
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: prefix
   *         required: true
   *         schema:
   *           type: string
   *         description: Prefix to get suggestions for
   *     responses:
   *       200:
   *         description: List of suggestions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: string
   *       400:
   *         description: Bad request
   */
  router.get('/suggestions', async (req: Request, res: Response) => {
    try {
      const prefix = req.query.prefix as string;

      if (!prefix) {
        return res.status(400).json({ success: false, message: 'Query parameter "prefix" is required' });
      }

      const suggestions = await getSuggestionsUseCase.execute(prefix);
      res.status(200).json({ success: true, data: suggestions });
    } catch (error: any) {
      logger.error(`[SearchRoutes] Error in GET /suggestions: ${error.message}`);
      res.status(500).json({ success: false, message: 'Internal server error getting suggestions' });
    }
  });

  return router;
}
