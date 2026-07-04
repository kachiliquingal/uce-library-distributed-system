import assert from 'assert';
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
    // Mock valid for "123", invalid for others
    return isbn === "123";
  }
}

async function runTests() {
  console.log('Running unit tests for inventory-service...');
  
  const repo = new MockInventoryRepository();
  const catalogClient = new MockCatalogGrpcClient();
  const useCase = new ManageStockUseCase(repo as any, catalogClient as any);

  try {
    // 1. Test Domain Logic
    const stock = new PhysicalStock('111', 10, 10, 'A1');
    stock.addCopies(5);
    assert.strictEqual(stock.totalCopies, 15, 'Total copies should increment');
    assert.strictEqual(stock.availableCopies, 15, 'Available copies should increment');
    
    stock.reduceCopies(2);
    assert.strictEqual(stock.totalCopies, 13, 'Total copies should decrement');
    assert.strictEqual(stock.availableCopies, 13, 'Available copies should decrement');
    
    let errorThrown = false;
    try {
      stock.reduceCopies(20);
    } catch(e) {
      errorThrown = true;
    }
    assert.ok(errorThrown, 'Should throw error when reducing more than available');

    // 2. Test Application Use Cases
    // Invalid ISBN creation
    let invalidCreation = false;
    try {
      await useCase.createStock('999', 5, 'B2');
    } catch(e: any) {
      invalidCreation = true;
      assert.ok(e.message.includes('not found in Catalog'), 'Should fail catalog validation');
    }
    assert.ok(invalidCreation, 'Should not create stock for unknown ISBN');

    // Valid ISBN creation
    const newStock = await useCase.createStock('123', 5, 'B2');
    assert.strictEqual(newStock.isbn, '123');
    assert.strictEqual(newStock.totalCopies, 5);
    assert.strictEqual(newStock.shelfLocation, 'B2');

    // Add Stock
    const updatedStock = await useCase.addStock('123', 3);
    assert.strictEqual(updatedStock.totalCopies, 8);

    // Get Low Stock
    const lowStock = await useCase.getLowStock(10);
    assert.strictEqual(lowStock.length, 1);
    assert.strictEqual(lowStock[0].isbn, '123');

    const noLowStock = await useCase.getLowStock(5);
    assert.strictEqual(noLowStock.length, 0);

    console.log('All tests passed successfully! ✅');
  } catch (err: any) {
    console.error('Test failed: ', err.message);
    process.exit(1);
  }
}

runTests();
