import nano from 'nano';
import { PhysicalStock } from '../../domain/PhysicalStock';
import { IInventoryRepository } from '../../domain/IInventoryRepository';
import { logger } from '../../utils/logger';

export class CouchDBAdapter implements IInventoryRepository {
  private db: nano.DocumentScope<any>;
  private dbName = 'inventory';

  constructor() {
    const url = process.env.COUCHDB_URL || 'http://admin:admin@localhost:5984';
    const couch = nano(url);
    
    // Initialize DB if not exists
    couch.db.create(this.dbName).catch((err) => {
      if (err.error !== 'file_exists') {
        logger.error(`Error creating CouchDB database: ${err.message}`);
      }
    });

    this.db = couch.use(this.dbName);
  }

  async findByIsbn(isbn: string): Promise<PhysicalStock | null> {
    try {
      const doc = await this.db.get(isbn);
      return new PhysicalStock(
        doc.isbn,
        doc.totalCopies,
        doc.availableCopies,
        doc.shelfLocation,
        new Date(doc.updatedAt)
      );
    } catch (err: any) {
      if (err.statusCode === 404) return null;
      throw err;
    }
  }

  async save(stock: PhysicalStock): Promise<void> {
    try {
      let rev = undefined;
      try {
        const existing = await this.db.get(stock.isbn);
        rev = existing._rev;
      } catch (err: any) {
        if (err.statusCode !== 404) throw err;
      }

      await this.db.insert({
        _id: stock.isbn,
        _rev: rev,
        isbn: stock.isbn,
        totalCopies: stock.totalCopies,
        availableCopies: stock.availableCopies,
        shelfLocation: stock.shelfLocation,
        updatedAt: stock.updatedAt.toISOString(),
      });
    } catch (err: any) {
      logger.error(`Error saving to CouchDB: ${err.message}`);
      throw err;
    }
  }

  async findLowStock(threshold: number): Promise<PhysicalStock[]> {
    // CouchDB Mango Query
    try {
      await this.db.createIndex({
        index: { fields: ['availableCopies'] },
        name: 'available-copies-index'
      });

      const response = await this.db.find({
        selector: {
          availableCopies: { $lt: threshold }
        }
      });

      return response.docs.map(doc => new PhysicalStock(
        doc.isbn,
        doc.totalCopies,
        doc.availableCopies,
        doc.shelfLocation,
        new Date(doc.updatedAt)
      ));
    } catch (err: any) {
      logger.error(`Error finding low stock: ${err.message}`);
      throw err;
    }
  }
}
