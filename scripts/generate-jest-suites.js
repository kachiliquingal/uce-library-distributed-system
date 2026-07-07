const fs = require('fs');
const path = require('path');

const kafkaMock = `jest.mock("../src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));`;

const suites = {
  'auth-service': `import { RegisterUserUseCase } from "../src/application/use-cases/RegisterUserUseCase";
import { LoginUserUseCase } from "../src/application/use-cases/LoginUserUseCase";
import { User } from "../src/domain/entities/User";
import { UserRepository } from "../src/domain/ports/UserRepository";
import { PasswordHasher } from "../src/domain/ports/PasswordHasher";

${kafkaMock}

class MockUserRepository implements UserRepository {
  private users: User[] = [];
  async save(user: User): Promise<User> {
    const savedUser = new User(this.users.length + 1, user.email, user.passwordHash, user.role);
    this.users.push(savedUser);
    return savedUser;
  }
  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }
  async findById(id: number): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }
  clear(): void {
    this.users = [];
  }
}

class MockPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return "hashed_" + password;
  }
  async compare(password: string, hash: string): Promise<boolean> {
    return hash === "hashed_" + password;
  }
}

describe("Auth Service Unit Tests", () => {
  test("User Entity Tests", () => {
    const adminUser = new User(1, "admin@uce.edu.ec", "hash", "ADMIN");
    expect(adminUser.isAdmin()).toBe(true);
    const regularUser = new User(2, "user@uce.edu.ec", "hash", "USER");
    expect(regularUser.isAdmin()).toBe(false);
    expect(adminUser.email).toBe("admin@uce.edu.ec");
    expect(adminUser.id).toBe(1);
    expect(adminUser.role).toBe("ADMIN");
  });

  test("RegisterUserUseCase Tests", async () => {
    const repo = new MockUserRepository();
    const hasher = new MockPasswordHasher();
    const registerUseCase = new RegisterUserUseCase(repo, hasher);

    const result = await registerUseCase.execute("test@uce.edu.ec", "password123");
    expect(result.email).toBe("test@uce.edu.ec");
    expect(result.id).toBe(1);
    expect(result.role).toBe("USER");

    const adminResult = await registerUseCase.execute("admin@uce.edu.ec", "admin123", "ADMIN");
    expect(adminResult.role).toBe("ADMIN");

    await expect(registerUseCase.execute("test@uce.edu.ec", "otherpassword")).rejects.toThrow("User with this email already exists");
  });

  test("LoginUserUseCase Tests", async () => {
    const repo = new MockUserRepository();
    const hasher = new MockPasswordHasher();
    const registerUseCase = new RegisterUserUseCase(repo, hasher);
    const loginUseCase = new LoginUserUseCase(repo, hasher);

    await registerUseCase.execute("login@uce.edu.ec", "mypassword");

    const user = await loginUseCase.execute("login@uce.edu.ec", "mypassword");
    expect(user.email).toBe("login@uce.edu.ec");
    expect(user.id).toBe(1);

    await expect(loginUseCase.execute("login@uce.edu.ec", "wrongpassword")).rejects.toThrow("Invalid email or password");
    await expect(loginUseCase.execute("nonexistent@uce.edu.ec", "anypassword")).rejects.toThrow("Invalid email or password");
  });
});
`,

  'catalog-service': `import { CreateBookUseCase } from "../src/application/use-cases/CreateBookUseCase";
import { GetAllBooksUseCase } from "../src/application/use-cases/GetAllBooksUseCase";
import { UpdateBookUseCase } from "../src/application/use-cases/UpdateBookUseCase";
import { DeleteBookUseCase } from "../src/application/use-cases/DeleteBookUseCase";
import { Book } from "../src/domain/entities/Book";
import { BookRepository } from "../src/domain/ports/BookRepository";

${kafkaMock}

class MockBookRepository implements BookRepository {
  private books: Book[] = [];
  private idCounter = 1;

  async save(book: Book): Promise<Book> {
    const savedBook: Book = { ...book, id: String(this.idCounter++) };
    this.books.push(savedBook);
    return savedBook;
  }
  async findAll(): Promise<Book[]> {
    return [...this.books];
  }
  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.books.find((b) => b.isbn === isbn) || null;
  }
  async findById(id: string): Promise<Book | null> {
    return this.books.find((b) => b.id === id) || null;
  }
  async findAllAuthors(): Promise<string[]> {
    return Array.from(new Set(this.books.map((b) => b.author)));
  }
  async update(id: string, bookData: Partial<Book>): Promise<Book | null> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.books[index] = { ...this.books[index], ...bookData };
    return this.books[index];
  }
  async delete(id: string): Promise<boolean> {
    const index = this.books.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.books.splice(index, 1);
    return true;
  }
  clear(): void {
    this.books = [];
    this.idCounter = 1;
  }
}

const sampleBook: Book = {
  title: "Clean Architecture",
  author: "Robert C. Martin",
  isbn: "978-0134494166",
  publishedYear: 2017,
  category: "Software Engineering",
  available: false,
};

describe("Catalog Service Unit Tests", () => {
  test("CreateBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);

    const book = await createBook.execute({ ...sampleBook });
    expect(book.id).toBeDefined();
    expect(book.title).toBe("Clean Architecture");
    expect(book.isbn).toBe("978-0134494166");
    expect(book.available).toBe(true);

    await expect(createBook.execute({ ...sampleBook })).rejects.toThrow("A book with this ISBN already exists in the catalog");

    const book2 = await createBook.execute({
      ...sampleBook,
      title: "Domain-Driven Design",
      isbn: "978-0321125217",
    });
    expect(book2.title).toBe("Domain-Driven Design");
    expect(book2.id).not.toBe(book.id);
  });

  test("GetAllBooksUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const getAllBooks = new GetAllBooksUseCase(repo);

    const emptyBooks = await getAllBooks.execute();
    expect(emptyBooks.length).toBe(0);

    await createBook.execute({ ...sampleBook });
    await createBook.execute({ ...sampleBook, title: "Refactoring", isbn: "978-0201485677" });

    const allBooks = await getAllBooks.execute();
    expect(allBooks.length).toBe(2);
  });

  test("UpdateBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const updateBook = new UpdateBookUseCase(repo);

    const created = await createBook.execute({ ...sampleBook });

    const updated = await updateBook.execute(created.id!, { title: "Clean Architecture (Updated)" });
    expect(updated.title).toBe("Clean Architecture (Updated)");
    expect(updated.isbn).toBe(sampleBook.isbn);

    await expect(updateBook.execute(created.id!, { isbn: "new-isbn" })).rejects.toThrow("ISBN cannot be modified after creation");
    await expect(updateBook.execute("non-existent-id", { title: "Test" })).rejects.toThrow("Book with id non-existent-id not found in the catalog");
  });

  test("DeleteBookUseCase Tests", async () => {
    const repo = new MockBookRepository();
    const createBook = new CreateBookUseCase(repo);
    const deleteBook = new DeleteBookUseCase(repo);
    const getAllBooks = new GetAllBooksUseCase(repo);

    const created = await createBook.execute({ ...sampleBook });

    const result = await deleteBook.execute(created.id!);
    expect(result).toBe(true);

    const remaining = await getAllBooks.execute();
    expect(remaining.length).toBe(0);

    await expect(deleteBook.execute("non-existent-id")).rejects.toThrow("Cannot delete: Book with id non-existent-id not found");
  });
});
`,

  'user-service': `import { UserUseCases } from "../src/application/UserUseCases";
import { UserRepository } from "../src/domain/UserRepository";
import { User } from "../src/domain/entities";

${kafkaMock}

class MockUserRepository implements UserRepository {
  private users: User[] = [];

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...data,
      id: "mock-id-" + (this.users.length + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
      roles: []
    };
    this.users.push(newUser);
    return newUser;
  }
  async getUserById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) || null;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) || null;
  }
  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.roles.push({ id: "role-" + roleName, name: roleName, permissions: [] });
    }
  }
  clear(): void {
    this.users = [];
  }
}

describe("User Service Unit Tests", () => {
  test("UserUseCases Tests", async () => {
    const repo = new MockUserRepository();
    const userUseCases = new UserUseCases(repo);

    const result = await userUseCases.createUser({
      email: "test@uce.edu.ec",
      firstName: "Test",
      lastName: "User",
      isActive: true,
      roles: []
    });

    expect(result.email).toBe("test@uce.edu.ec");
    expect(result.id).toBe("mock-id-1");

    await expect(userUseCases.createUser({
      email: "test@uce.edu.ec",
      firstName: "Duplicate",
      lastName: "User",
      isActive: true,
      roles: []
    })).rejects.toThrow("User already exists with this email");

    await userUseCases.assignRole(result.id, "ADMIN");
    const updatedUser = await userUseCases.getUserById(result.id);
    expect(updatedUser?.roles.some(r => r.name === "ADMIN")).toBe(true);
  });
});
`,

  'loan-service': `import { BorrowBookUseCase, ReturnBookUseCase, GetLoansUseCase } from '../src/application/use-cases/LoanUseCases';
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
`,

  'notification-service': `import { CreateNotificationUseCase } from '../src/application/use-cases/CreateNotificationUseCase';
import { GetNotificationsUseCase } from '../src/application/use-cases/GetNotificationsUseCase';
import { NotificationRepository } from '../src/domain/repositories/NotificationRepository';
import { Notification } from '../src/domain/entities/Notification';

class MockNotificationRepository implements NotificationRepository {
  private notifications: Notification[] = [];

  async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }
  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId);
  }
  async findAll(): Promise<Notification[]> {
    return this.notifications;
  }
  async updateStatus(id: string, status: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = status as any;
    }
  }
}

describe("Notification Service Unit Tests", () => {
  test("Notification Use Cases Tests", async () => {
    const repository = new MockNotificationRepository();
    const createUseCase = new CreateNotificationUseCase(repository);
    const getUseCase = new GetNotificationsUseCase(repository);

    await createUseCase.execute('user123', 'EMAIL', 'Test Subject', 'Test Body');

    const notifications = await getUseCase.executeByUserId('user123');
    expect(notifications.length).toBe(1);
    expect(notifications[0].subject).toBe('Test Subject');
    expect(notifications[0].status).toBe('SENT');

    await createUseCase.execute('user2', 'PUSH', 'S2', 'B2');

    const all = await getUseCase.executeAll();
    expect(all.length).toBe(2);
  });
});
`,

  'fine-service': `import { Fine } from '../src/domain/Fine';
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
`,

  'inventory-service': `import { PhysicalStock } from '../src/domain/PhysicalStock';
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
`,

  'report-service': `import { AnalyticsUseCase } from '../src/application/use-cases/AnalyticsUseCase';
import { IReportRepository } from '../src/domain/IReportRepository';
import { ReportMetric, DailyLoanCount, TopBorrowedBook, FineRevenueSummary } from '../src/domain/ReportMetric';

class MockReportRepository implements IReportRepository {
  public metrics: ReportMetric[] = [];

  async saveMetric(metric: ReportMetric): Promise<void> {
    this.metrics.push(metric);
  }
  async getLoansPerDay(_days?: number): Promise<DailyLoanCount[]> {
    return [
      { date: '2026-07-01', count: 10 },
      { date: '2026-07-02', count: 15 }
    ];
  }
  async getTopBorrowedBooks(_limit?: number): Promise<TopBorrowedBook[]> {
    return [
      { bookId: '123', title: 'Test Book 1', borrowCount: 20 },
      { bookId: '456', title: 'Test Book 2', borrowCount: 15 }
    ];
  }
  async getActiveUsersCount(_days?: number): Promise<number> {
    return 42;
  }
  async getFineRevenueSummary(): Promise<FineRevenueSummary> {
    return {
      totalRevenue: 100.50,
      paidCount: 10,
      pendingCount: 2,
      pendingAmount: 20.00
    };
  }
}

describe("Report Service Unit Tests", () => {
  test("AnalyticsUseCase Tests", async () => {
    const repo = new MockReportRepository();
    const useCase = new AnalyticsUseCase(repo);

    await useCase.recordEvent('loans', { bookId: '123', userId: '456', action: 'borrowed' }, { count: 1 });
    expect(repo.metrics.length).toBe(1);
    expect(repo.metrics[0].measurement).toBe('loans');
    expect(repo.metrics[0].tags.bookId).toBe('123');
    expect(repo.metrics[0].fields.count).toBe(1);

    const loans = await useCase.getLoansPerDay(7);
    expect(loans.length).toBe(2);
    expect(loans[0].count).toBe(10);

    const topBooks = await useCase.getTopBorrowedBooks(5);
    expect(topBooks.length).toBe(2);
    expect(topBooks[0].title).toBe('Test Book 1');

    const activeUsers = await useCase.getActiveUsersCount(30);
    expect(activeUsers).toBe(42);

    const fineSummary = await useCase.getFineRevenueSummary();
    expect(fineSummary.totalRevenue).toBe(100.50);
    expect(fineSummary.paidCount).toBe(10);
  });
});
`,

  'reservation-service': `import { CreateReservationWithOutboxUseCase } from '../src/application/use-cases/CreateReservationWithOutboxUseCase';
import { GetReservationsUseCase } from '../src/application/use-cases/GetReservationsUseCase';
import { CancelReservationUseCase } from '../src/application/use-cases/CancelReservationUseCase';
import { GetRoomsAvailabilityUseCase } from '../src/application/use-cases/GetRoomsAvailabilityUseCase';
import { IReservationRepository } from '../src/domain/IReservationRepository';
import { IMessageBroker } from '../src/domain/IMessageBroker';
import { StudyRoom } from '../src/domain/StudyRoom';
import { Reservation, ReservationStatus } from '../src/domain/Reservation';
import { OutboxEvent } from '../src/domain/OutboxEvent';

class MockReservationRepository implements IReservationRepository {
  public rooms: StudyRoom[] = [
    {
      id: 'room-adm-1',
      name: 'Sala de Lectura Silenciosa - Administrativas',
      faculty: 'Facultad de Ciencias Administrativas',
      type: 'QUIET_READING',
      capacity: 6,
      location: 'Edificio Central - Piso 2',
      amenities: ['Wi-Fi 6', 'Pizarra acrílica', 'Aire acondicionado'],
      currentStatus: 'AVAILABLE',
      activeReservationId: undefined
    },
    {
      id: 'room-adm-2',
      name: 'Sala Multimedia - Administrativas',
      faculty: 'Facultad de Ciencias Administrativas',
      type: 'GROUP_MULTIMEDIA',
      capacity: 8,
      location: 'Edificio Central - Piso 3',
      amenities: ['Proyector 4K', 'Audio envolvente'],
      currentStatus: 'AVAILABLE',
      activeReservationId: undefined
    }
  ];
  public reservations: Reservation[] = [];
  public outbox: OutboxEvent[] = [];

  async getRooms(): Promise<StudyRoom[]> {
    return this.rooms;
  }
  async getRoomById(roomId: string): Promise<StudyRoom | null> {
    return this.rooms.find(r => r.id === roomId) || null;
  }
  async createWithOutbox(
    reservation: Reservation,
    roomUpdate: Partial<StudyRoom>,
    outboxEvent: OutboxEvent
  ): Promise<void> {
    this.reservations.push(reservation);
    const room = this.rooms.find(r => r.id === reservation.roomId);
    if (room && roomUpdate.currentStatus) {
      room.currentStatus = roomUpdate.currentStatus;
      room.activeReservationId = roomUpdate.activeReservationId;
    }
    this.outbox.push(outboxEvent);
  }
  async findById(reservationId: string): Promise<Reservation | null> {
    return this.reservations.find(r => r.id === reservationId) || null;
  }
  async findByUser(userId: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.userId === userId);
  }
  async findActiveByUser(userId: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.userId === userId && r.status === 'ACTIVE');
  }
  async findByRoomAndDate(roomId: string, date: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.roomId === roomId && r.date === date);
  }
  async findAll(): Promise<Reservation[]> {
    return this.reservations;
  }
  async findActiveExpired(currentEpochSeconds: number): Promise<Reservation[]> {
    return this.reservations.filter(r => r.status === 'ACTIVE' && r.expiresAt !== undefined && r.expiresAt <= currentEpochSeconds);
  }
  async updateStatusWithOutbox(
    reservationId: string,
    status: ReservationStatus,
    roomId: string,
    roomStatus: StudyRoom['currentStatus'],
    outboxEvent: OutboxEvent
  ): Promise<void> {
    const res = this.reservations.find(r => r.id === reservationId);
    if (res) res.status = status;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.currentStatus = roomStatus;
      if (roomStatus === 'AVAILABLE') room.activeReservationId = undefined;
    }
    this.outbox.push(outboxEvent);
  }
  async updateRoomStatus(roomId: string, status: StudyRoom['currentStatus'], activeReservationId?: string): Promise<void> {
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.currentStatus = status;
      room.activeReservationId = activeReservationId;
    }
  }
  async getPendingOutboxEvents(): Promise<OutboxEvent[]> {
    return this.outbox.filter(e => e.status === 'PENDING');
  }
  async markOutboxPublished(eventId: string): Promise<void> {
    const evt = this.outbox.find(e => e.id === eventId);
    if (evt) {
      evt.status = 'PUBLISHED';
      evt.publishedAt = new Date().toISOString();
    }
  }
}

class MockMessageBroker implements IMessageBroker {
  public publishedKafka: { topic: string; message: any }[] = [];
  public publishedMqtt: { topic: string; payload: any }[] = [];

  async publishKafka(topic: string, message: any): Promise<void> {
    this.publishedKafka.push({ topic, message });
  }
  async publishMqtt(topic: string, payload: any): Promise<void> {
    this.publishedMqtt.push({ topic, payload });
  }
  async close(): Promise<void> {}
}

describe("Reservation Service Unit Tests", () => {
  test("Reservation ACID 3-operation and Outbox Use Cases", async () => {
    const repo = new MockReservationRepository();
    const broker = new MockMessageBroker();

    const createUseCase = new CreateReservationWithOutboxUseCase(repo, broker);
    const getReservationsUseCase = new GetReservationsUseCase(repo);
    const cancelUseCase = new CancelReservationUseCase(repo, broker);
    const getRoomsUseCase = new GetRoomsAvailabilityUseCase(repo);

    const rooms = await getRoomsUseCase.execute();
    expect(rooms.length).toBe(2);
    expect(rooms[0].currentStatus).toBe('AVAILABLE');

    const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const todayStr = nowEcuador.toISOString().split('T')[0];

    const reservation = await createUseCase.execute({
      userId: 'user-001',
      userEmail: 'estudiante@uce.edu.ec',
      userName: 'Alejandro Estudiante',
      roomId: 'room-adm-1',
      date: todayStr,
      startTime: '10:00',
      purpose: 'Estudio individual',
      attendees: 1
    });

    expect(reservation.durationMinutes).toBe(5);
    expect(reservation.endTime).toBe('10:05');
    expect(repo.reservations.length).toBe(1);
    expect(repo.rooms[0].currentStatus).toBe('RESERVED');
    expect(repo.outbox.length).toBe(1);
    expect(repo.outbox[0].eventType).toBe('reservation.created');

    await expect(createUseCase.execute({
      userId: 'user-001',
      userEmail: 'estudiante@uce.edu.ec',
      userName: 'Alejandro Estudiante',
      roomId: 'room-adm-2',
      date: todayStr,
      startTime: '11:00'
    })).rejects.toThrow(/reserva activa/);

    await expect(createUseCase.execute({
      userId: 'user-002',
      userEmail: 'otro@uce.edu.ec',
      userName: 'Otro Estudiante',
      roomId: 'room-adm-2',
      date: '2028-01-01',
      startTime: '14:00'
    })).rejects.toThrow(/solo están permitidas para el día de hoy/);

    const list = await getReservationsUseCase.execute({ userId: 'user-001' });
    expect(list.length).toBe(1);

    await cancelUseCase.execute(reservation.id, 'user-001', false);
    expect(repo.reservations[0].status).toBe('CANCELLED');
    expect(repo.rooms[0].currentStatus).toBe('AVAILABLE');
    expect(repo.outbox.length).toBe(2);
  });
});
`,

  'search-service': `import { SearchBooksUseCase } from "../src/application/use-cases/SearchBooksUseCase";
import { GetSuggestionsUseCase } from "../src/application/use-cases/GetSuggestionsUseCase";
import { IndexBookUseCase } from "../src/application/use-cases/IndexBookUseCase";
import { SearchRepository } from "../src/domain/repositories/SearchRepository";
import { SearchableBook } from "../src/domain/entities/SearchableBook";
import { SearchResult } from "../src/domain/value-objects/SearchResult";

class MockSearchRepository implements SearchRepository {
  public books: SearchableBook[] = [];

  async indexBook(book: SearchableBook): Promise<void> {
    this.books.push(book);
  }
  async updateBook(isbn: string, bookData: Partial<SearchableBook>): Promise<void> {
    const index = this.books.findIndex(b => b.isbn === isbn);
    if (index !== -1) {
      this.books[index] = { ...this.books[index], ...bookData };
    }
  }
  async search(query: string, page: number, limit: number): Promise<SearchResult> {
    const hits = this.books.filter(b => 
      b.title.toLowerCase().includes(query.toLowerCase()) || 
      b.author.toLowerCase().includes(query.toLowerCase())
    );
    return {
      hits,
      total: hits.length,
      page,
      limit
    };
  }
  async suggest(prefix: string): Promise<string[]> {
    const suggestions = this.books
      .filter(b => b.title.toLowerCase().startsWith(prefix.toLowerCase()))
      .map(b => b.title);
    return Array.from(new Set(suggestions));
  }
}

const sampleBook = {
  isbn: "123-456",
  title: "Clean Code",
  author: "Robert C. Martin",
  description: "A Handbook of Agile Software Craftsmanship",
  category: "Software Engineering",
  publishedYear: 2008
};

describe("Search Service Unit Tests", () => {
  test("SearchBooksUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);
    const searchBooks = new SearchBooksUseCase(repo);

    await indexBook.execute(sampleBook);

    await expect(searchBooks.execute("")).rejects.toThrow("Search query cannot be empty");

    const result = await searchBooks.execute("Clean");
    expect(result.hits.length).toBe(1);
    expect(result.hits[0].title).toBe("Clean Code");
  });

  test("GetSuggestionsUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);
    const getSuggestions = new GetSuggestionsUseCase(repo);

    await indexBook.execute(sampleBook);
    await indexBook.execute({ ...sampleBook, isbn: "222", title: "Clean Architecture" });

    const resultEmpty = await getSuggestions.execute("");
    expect(resultEmpty.length).toBe(0);

    const suggestions = await getSuggestions.execute("Cle");
    expect(suggestions.length).toBe(2);
    expect(suggestions.includes("Clean Code")).toBe(true);
    expect(suggestions.includes("Clean Architecture")).toBe(true);
  });

  test("IndexBookUseCase Tests", async () => {
    const repo = new MockSearchRepository();
    const indexBook = new IndexBookUseCase(repo);

    await expect(indexBook.execute({ title: "No ISBN" })).rejects.toThrow("Invalid book data for indexing");

    await indexBook.execute(sampleBook);
    expect(repo.books.length).toBe(1);
    expect(repo.books[0].indexedAt).toBeDefined();
  });
});
`
};

console.log("Generating clean Jest unit test suites with Kafka mocks...");

for (const [service, content] of Object.entries(suites)) {
  const filePath = path.join(__dirname, '..', 'apps', service, 'tests', 'unit.test.ts');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("✅ Generated Jest unit test suite for " + service);
}

console.log("🎉 All 10 microservices successfully updated!");
