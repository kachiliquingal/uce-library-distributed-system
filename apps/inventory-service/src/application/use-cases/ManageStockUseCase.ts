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
}
