import { BorrowBookUseCase, ReturnBookUseCase, GetLoansUseCase } from '../src/application/use-cases/LoanUseCases';
import { ILoanRepository } from '../src/domain/ILoanRepository';
import { Loan, LoanStatus } from '../src/domain/Loan';
import { UserClient } from '../src/infrastructure/grpc/UserClient';
import { KafkaProducer, RabbitMQProducer } from '../src/infrastructure/messaging/Producers';

// --- Mocks ---
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

// Override static methods
UserClient.validateUser = async (userId: string) => ({ isValid: userId !== 'invalid', name: 'Test User' });
KafkaProducer.emit = async () => {};
RabbitMQProducer.emit = () => {};

// --- Test Runner ---
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

async function assertThrows(fn: () => Promise<unknown>, expectedMessage: string, testName: string): Promise<void> {
  try {
    await fn();
    console.error(`  ❌ ${testName} (expected error but none was thrown)`);
    failed++;
  } catch (error: any) {
    if (error.message === expectedMessage) {
      console.log(`  ✅ ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ ${testName} (expected: "${expectedMessage}", got: "${error.message}")`);
      failed++;
    }
  }
}

// --- Tests ---
async function testBorrowBookUseCase() {
  console.log("\n📋 BorrowBookUseCase Tests:");
  const repo = new MockLoanRepository();
  const borrowUseCase = new BorrowBookUseCase(repo);

  const loan = await borrowUseCase.execute('user-1', 'isbn-1');
  assert(loan.userId === 'user-1' && loan.isbn === 'isbn-1', "Should create active loan for valid user");
  assert(loan.status === LoanStatus.ACTIVE, "Loan status should be ACTIVE");

  await assertThrows(
    () => borrowUseCase.execute('user-1', 'isbn-1'),
    "User already has an active loan for this book",
    "Should throw if user tries to borrow the same book twice"
  );

  await assertThrows(
    () => borrowUseCase.execute('invalid', 'isbn-2'),
    "User is not valid or does not exist",
    "Should throw if user is invalid via gRPC"
  );
}

async function testReturnBookUseCase() {
  console.log("\n📋 ReturnBookUseCase Tests:");
  const repo = new MockLoanRepository();
  const borrowUseCase = new BorrowBookUseCase(repo);
  const returnUseCase = new ReturnBookUseCase(repo);

  const loan = await borrowUseCase.execute('user-2', 'isbn-3');
  const returnedLoan = await returnUseCase.execute(loan.id);

  assert(returnedLoan.status === LoanStatus.RETURNED, "Loan status should be RETURNED");
  assert(returnedLoan.returnDate !== null, "Return date should be set");
}

async function main(): Promise<void> {
  console.log("🧪 Loan Service - Unit Tests\n" + "=".repeat(40));

  await testBorrowBookUseCase();
  await testReturnBookUseCase();

  console.log("\n" + "=".repeat(40));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
