import { PhysicalStock } from '../../domain/PhysicalStock';
import { IInventoryRepository } from '../../domain/IInventoryRepository';
import { ICatalogGrpcClient } from '../../domain/ICatalogGrpcClient';

export class ManageStockUseCase {
  constructor(
    private repository: IInventoryRepository,
    private catalogClient: ICatalogGrpcClient
  ) {}

  async createStock(isbn: string, initialCopies: number, shelfLocation: string): Promise<PhysicalStock> {
    const existing = await this.repository.findByIsbn(isbn);
    if (existing) {
      throw new Error(`Stock for ISBN ${isbn} already exists. Use addStock instead.`);
    }

    // Connect to Catalog Service via gRPC to ensure the ISBN is registered
    const isValid = await this.catalogClient.validateIsbn(isbn);
    if (!isValid) {
      throw new Error(`ISBN ${isbn} not found in Catalog. Cannot create physical stock for unknown books.`);
    }

    const stock = new PhysicalStock(isbn, initialCopies, initialCopies, shelfLocation);
    await this.repository.save(stock);
    return stock;
  }

  async addStock(isbn: string, copiesToAdd: number): Promise<PhysicalStock> {
    const stock = await this.repository.findByIsbn(isbn);
    if (!stock) {
      throw new Error(`Stock for ISBN ${isbn} not found. Create it first.`);
    }
    
    stock.addCopies(copiesToAdd);
    await this.repository.save(stock);
    return stock;
  }

  async getStock(isbn: string): Promise<PhysicalStock | null> {
    return this.repository.findByIsbn(isbn);
  }

  async getLowStock(threshold: number = 5): Promise<PhysicalStock[]> {
    return this.repository.findLowStock(threshold);
  }

  async reduceStock(isbn: string, count: number = 1): Promise<PhysicalStock> {
    const stock = await this.repository.findByIsbn(isbn);
    if (!stock) {
      throw new Error(`Stock for ISBN ${isbn} not found.`);
    }
    if (stock.availableCopies < count) {
      // If already at 0 or less than count, just set availableCopies to 0 to prevent negative stock in legacy edge cases
      stock.availableCopies = 0;
      stock.updatedAt = new Date();
    } else {
      stock.availableCopies -= count;
      stock.updatedAt = new Date();
    }
    await this.repository.save(stock);
    return stock;
  }

  async returnStock(isbn: string, count: number = 1): Promise<PhysicalStock> {
    const stock = await this.repository.findByIsbn(isbn);
    if (!stock) {
      throw new Error(`Stock for ISBN ${isbn} not found.`);
    }
    if (stock.availableCopies + count <= stock.totalCopies) {
      stock.availableCopies += count;
    } else {
      stock.availableCopies = stock.totalCopies;
    }
    stock.updatedAt = new Date();
    await this.repository.save(stock);
    return stock;
  }

  async syncLegacyLoans(isbns: string[] = [
    "9780132350884", "9780201633610", "978-1204-30-2", "978-2403-21-3",
    "978-9879-38-21", "978-7080-89-62", "978-5198-29-149", "978-4454-25-171",
    "978-2711-79-214", "978-5191-19-226", "978-7277-51-391", "978-8837-72-702"
  ]): Promise<any[]> {
    const results = [];
    for (const isbn of isbns) {
      try {
        const stock = await this.repository.findByIsbn(isbn);
        if (stock) {
          stock.availableCopies = 0;
          stock.updatedAt = new Date();
          await this.repository.save(stock);
          results.push({ isbn, status: 'synced', availableCopies: 0 });
        } else {
          results.push({ isbn, status: 'not_found' });
        }
      } catch (err: any) {
        results.push({ isbn, status: 'error', error: err.message });
      }
    }
    return results;
  }
}
