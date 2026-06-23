import { ILoanRepository } from '../../domain/ILoanRepository';
import { Loan, LoanStatus } from '../../domain/Loan';
import { AppDataSource } from './data-source';
import { LoanEntity } from './loan.entity';

export class LoanRepositoryImpl implements ILoanRepository {
  private repository = AppDataSource.getRepository(LoanEntity);

  async save(loan: Loan): Promise<Loan> {
    const entity = this.repository.create({
      id: loan.id,
      userId: loan.userId,
      isbn: loan.isbn,
      borrowDate: loan.borrowDate,
      dueDate: loan.dueDate,
      returnDate: loan.returnDate,
      status: loan.status,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Loan | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { borrowDate: 'DESC' },
    });
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  async findAllActive(page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      where: { status: LoanStatus.ACTIVE },
      skip: (page - 1) * limit,
      take: limit,
      order: { borrowDate: 'DESC' },
    });
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ data: Loan[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { borrowDate: 'DESC' },
    });
    return { data: entities.map(e => this.toDomain(e)), total };
  }

  private toDomain(entity: LoanEntity): Loan {
    return new Loan(
      entity.id,
      entity.userId,
      entity.isbn,
      entity.borrowDate,
      entity.dueDate,
      entity.returnDate,
      entity.status
    );
  }
}
