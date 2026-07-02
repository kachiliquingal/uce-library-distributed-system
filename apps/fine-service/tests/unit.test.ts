import assert from 'assert';
import { Fine } from '../src/domain/Fine';
import { CreateFineUseCase } from '../src/application/use-cases/CreateFineUseCase';

// Mock Repository
class MockFineRepository {
  public fines: Fine[] = [];
  
  async save(fine: Fine) {
    this.fines.push(fine);
  }
  async findById(id: string) {
    return this.fines.find(f => f.id === id) || null;
  }
  async findByUserId(userId: string) {
    return this.fines.filter(f => f.userId === userId);
  }
  async findAll() {
    return this.fines;
  }
  async update(fine: Fine) {
    const idx = this.fines.findIndex(f => f.id === fine.id);
    if(idx !== -1) this.fines[idx] = fine;
  }
}

async function runTests() {
  console.log('Running unit tests for fine-service...');

  const repo = new MockFineRepository();
  const createFineUseCase = new CreateFineUseCase(repo as any);

  // Test: Create Fine
  const fine = await createFineUseCase.execute('user-1', 'loan-1', 5.00, 'Late return');
  assert.strictEqual(fine.userId, 'user-1', 'User ID should match');
  assert.strictEqual(fine.amount, 5.00, 'Amount should match');
  assert.strictEqual(fine.status, 'UNPAID', 'Initial status should be UNPAID');
  
  const savedFine = await repo.findById(fine.id);
  assert.ok(savedFine, 'Fine should be saved in repository');

  console.log('All tests passed successfully! ✅');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
