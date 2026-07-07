import { BorrowBookUseCase, ReturnBookUseCase, GetLoansUseCase } from '../src/application/use-cases/LoanUseCases';
import { ILoanRepository } from '../src/domain/ILoanRepository';
import { Loan, LoanStatus } from '../src/domain/Loan';
import { UserClient } from '../src/infrastructure/grpc/UserClient';
import { KafkaProducer, RabbitMQProducer } from '../src/infrastructure/messaging/Producers';

class MockLoanRepository implements ILoanRepository {
  public loans: Loan[] = [];

  async save(loan: Loan): Promise<Loan> {
    const existingIndex = this.loans.findIndex(l => l.id === loan.id);
    if (existingIndex >= 0) {
      this.loans[existingIndex] = loan;
    } else {
      this.loans.push(loan);
    }
    return loan;
  }
  async findById(id: string): Promise<Loan | null> {
    return this.loans.find(l => l.id === id) || null;
  }
  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    const data = this.loans.filter(l => l.userId === userId);
    return { data, total: data.length };
  }
  async findAllActive(page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    const data = this.loans.filter(l => l.status === LoanStatus.ACTIVE);
    return { data, total: data.length };
  }
  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    return { data: this.loans, total: this.loans.length };
  }
  clear() {
    this.loans = [];
  }
}

UserClient.validateUser = async (userId: string) => ({ isValid: userId !== 'invalid', name: 'Test User' });
KafkaProducer.emit = async () => {};
RabbitMQProducer.emit = () => {};

describe("Loan Service Unit Tests", () => {
  test("BorrowBookUseCase Tests", async () => {
    const repo = new MockLoanRepository();
    const borrowUseCase = new BorrowBookUseCase(repo);

    const loan = await borrowUseCase.execute('user-1', 'isbn-1');
    expect(loan.userId).toBe('user-1');
    expect(loan.isbn).toBe('isbn-1');
    expect(loan.status).toBe(LoanStatus.ACTIVE);

    await expect(borrowUseCase.execute('user-1', 'isbn-1')).rejects.toThrow("User already has an active loan for this book");
    await expect(borrowUseCase.execute('invalid', 'isbn-2')).rejects.toThrow("User is not valid or does not exist");
  });

  test("ReturnBookUseCase Tests", async () => {
    const repo = new MockLoanRepository();
    const borrowUseCase = new BorrowBookUseCase(repo);
    const returnUseCase = new ReturnBookUseCase(repo);

    const loan = await borrowUseCase.execute('user-2', 'isbn-3');
    const returnedLoan = await returnUseCase.execute(loan.id);

    expect(returnedLoan.status).toBe(LoanStatus.RETURNED);
    expect(returnedLoan.returnDate).not.toBeNull();
  });
});
