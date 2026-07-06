import { PhysicalStock } from '../src/domain/PhysicalStock';
import { ManageStockUseCase } from '../src/application/use-cases/ManageStockUseCase';

class MockInventoryRepository {
  public stocks: Map<string, PhysicalStock> = new Map();

  async findByIsbn(isbn: string): Promise<PhysicalStock | null> {
    return this.stocks.get(isbn) || null;
  }
  async save(stock: PhysicalStock): Promise<void> {
    this.stocks.set(stock.isbn, stock);
  }
  async findLowStock(threshold: number): Promise<PhysicalStock[]> {
    return Array.from(this.stocks.values()).filter(s => s.availableCopies < threshold);
  }
}

class MockCatalogGrpcClient {
  async validateIsbn(isbn: string): Promise<boolean> {
    return isbn === "123";
  }
}

describe("Inventory Service Unit Tests", () => {
  test("PhysicalStock Domain and ManageStockUseCase Tests", async () => {
    const repo = new MockInventoryRepository();
    const catalogClient = new MockCatalogGrpcClient();
    const useCase = new ManageStockUseCase(repo as any, catalogClient as any);

    const stock = new PhysicalStock('111', 10, 10, 'A1');
    stock.addCopies(5);
    expect(stock.totalCopies).toBe(15);
    expect(stock.availableCopies).toBe(15);

    stock.reduceCopies(2);
    expect(stock.totalCopies).toBe(13);
    expect(stock.availableCopies).toBe(13);

    expect(() => stock.reduceCopies(20)).toThrow();

    await expect(useCase.createStock('999', 5, 'B2')).rejects.toThrow();

    const newStock = await useCase.createStock('123', 5, 'B2');
    expect(newStock.isbn).toBe('123');
    expect(newStock.totalCopies).toBe(5);
    expect(newStock.shelfLocation).toBe('B2');

    const updatedStock = await useCase.addStock('123', 3);
    expect(updatedStock.totalCopies).toBe(8);

    const lowStock = await useCase.getLowStock(10);
    expect(lowStock.length).toBe(1);
    expect(lowStock[0].isbn).toBe('123');

    const noLowStock = await useCase.getLowStock(5);
    expect(noLowStock.length).toBe(0);
  });
});
