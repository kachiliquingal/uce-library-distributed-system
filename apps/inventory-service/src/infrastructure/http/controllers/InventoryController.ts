import { Request, Response } from 'express';
import { ManageStockUseCase } from '../../../application/use-cases/ManageStockUseCase';
import { logger } from '../../../utils/logger';

export class InventoryController {
  constructor(private manageStockUseCase: ManageStockUseCase) {}

  async createStock(req: Request, res: Response) {
    try {
      const { isbn, initialCopies, shelfLocation } = req.body;
      if (!isbn || initialCopies === undefined || !shelfLocation) {
        return res.status(400).json({ error: 'isbn, initialCopies, and shelfLocation are required' });
      }

      const stock = await this.manageStockUseCase.createStock(isbn, initialCopies, shelfLocation);
      return res.status(201).json(stock);
    } catch (err: any) {
      logger.error(`Error in createStock: ${err.message}`);
      // Differentiate between Validation errors (400) and Internal Server Errors (500)
      if (err.message.includes('not found in Catalog') || err.message.includes('already exists')) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async addStock(req: Request, res: Response) {
    try {
      const { isbn } = req.params;
      const { copiesToAdd } = req.body;
      if (!copiesToAdd || typeof copiesToAdd !== 'number' || copiesToAdd <= 0) {
        return res.status(400).json({ error: 'Valid copiesToAdd is required' });
      }

      const stock = await this.manageStockUseCase.addStock(isbn, copiesToAdd);
      return res.status(200).json(stock);
    } catch (err: any) {
      logger.error(`Error in addStock: ${err.message}`);
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getStock(req: Request, res: Response) {
    try {
      const { isbn } = req.params;
      const stock = await this.manageStockUseCase.getStock(isbn);
      if (!stock) {
        return res.status(404).json({ error: `Stock for ISBN ${isbn} not found` });
      }
      return res.status(200).json(stock);
    } catch (err: any) {
      logger.error(`Error in getStock: ${err.message}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getLowStock(req: Request, res: Response) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 5;
      const stocks = await this.manageStockUseCase.getLowStock(threshold);
      return res.status(200).json(stocks);
    } catch (err: any) {
      logger.error(`Error in getLowStock: ${err.message}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async syncLegacyLoans(req: Request, res: Response) {
    try {
      const isbns = req.body.isbns; // optional array of ISBNs
      const results = await this.manageStockUseCase.syncLegacyLoans(isbns);
      return res.status(200).json({ message: 'Legacy loans sync completed', results });
    } catch (err: any) {
      logger.error(`Error in syncLegacyLoans: ${err.message}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
