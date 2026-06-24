import { ILoanRepository } from '../../domain/ILoanRepository';
import { Loan } from '../../domain/Loan';
import { UserClient } from '../../infrastructure/grpc/UserClient';
import { KafkaProducer, RabbitMQProducer } from '../../infrastructure/messaging/Producers';
import { logger } from '../../utils/logger';

export class BorrowBookUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(userId: string, isbn: string): Promise<Loan> {
    // 1. Validar usuario vía gRPC
    const isUserValid = await UserClient.validateUser(userId);
    if (!isUserValid) {
      throw new Error('User is not valid or does not exist');
    }

    // 2. Idealmente, validar si el libro (isbn) existe y tiene stock vía Catalog/Inventory
    // Por ahora asumimos disponibilidad para hacer el "checkout automático"
    const activeLoans = await this.loanRepository.findByUserId(userId, 1, 100);
    const hasAlreadyBorrowed = activeLoans.data.some(l => l.isbn === isbn && l.status === 'ACTIVE');
    if (hasAlreadyBorrowed) {
      throw new Error('User already has an active loan for this book');
    }

    // 3. Crear el préstamo
    const loan = Loan.create(userId, isbn);
    const savedLoan = await this.loanRepository.save(loan);

    // 4. Emitir evento a Kafka
    await KafkaProducer.emit('book.borrowed', 'BookBorrowed', {
      loanId: savedLoan.id,
      userId: savedLoan.userId,
      isbn: savedLoan.isbn,
      borrowDate: savedLoan.borrowDate,
      dueDate: savedLoan.dueDate
    });

    logger.info(`[INF] Préstamo creado exitosamente: loanId=${savedLoan.id}, userId=${userId}, isbn=${isbn}`);

    return savedLoan;
  }
}

export class ReturnBookUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async execute(loanId: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    loan.returnBook(new Date());
    const savedLoan = await this.loanRepository.save(loan);

    // Emitir evento Kafka
    await KafkaProducer.emit('book.returned', 'BookReturned', {
      loanId: savedLoan.id,
      userId: savedLoan.userId,
      isbn: savedLoan.isbn,
      returnDate: savedLoan.returnDate,
      status: savedLoan.status
    });

    logger.info(`[INF] Préstamo devuelto exitosamente: loanId=${savedLoan.id}, isbn=${savedLoan.isbn}`);

    // Si hay mora, emitir a RabbitMQ
    if (savedLoan.status === 'OVERDUE') {
      RabbitMQProducer.emit('fine.trigger', {
        loanId: savedLoan.id,
        userId: savedLoan.userId,
        isbn: savedLoan.isbn,
        dueDate: savedLoan.dueDate,
        returnDate: savedLoan.returnDate,
        reason: 'Late Return'
      });
    }

    return savedLoan;
  }
}

export class GetLoansUseCase {
  constructor(private readonly loanRepository: ILoanRepository) {}

  async getByUser(userId: string, page: number, limit: number) {
    return this.loanRepository.findByUserId(userId, page, limit);
  }

  async getAll(page: number, limit: number) {
    return this.loanRepository.findAll(page, limit);
  }

  async getAllActive(page: number, limit: number) {
    return this.loanRepository.findAllActive(page, limit);
  }
}
