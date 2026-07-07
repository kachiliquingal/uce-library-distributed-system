import { Fine } from '../src/domain/Fine';
import { CreateFineUseCase } from '../src/application/use-cases/CreateFineUseCase';

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

describe("Fine Service Unit Tests", () => {
  test("CreateFineUseCase Tests", async () => {
    const repo = new MockFineRepository();
    const createFineUseCase = new CreateFineUseCase(repo as any);

    const fine = await createFineUseCase.execute('user-1', 'loan-1', 5.00, 'Late return');
    expect(fine.userId).toBe('user-1');
    expect(fine.amount).toBe(5.00);
    expect(fine.status).toBe('UNPAID');

    const savedFine = await repo.findById(fine.id);
    expect(savedFine).toBeDefined();
  });
});
