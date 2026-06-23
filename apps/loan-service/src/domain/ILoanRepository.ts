import { Loan } from './Loan';

export interface ILoanRepository {
  save(loan: Loan): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findByUserId(userId: string, page: number, limit: number): Promise<{ data: Loan[]; total: number }>;
  findAllActive(page: number, limit: number): Promise<{ data: Loan[]; total: number }>;
  findAll(page: number, limit: number): Promise<{ data: Loan[]; total: number }>;
}
