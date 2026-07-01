import * as crypto from 'crypto';

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

export class Loan {
  constructor(
    public id: string,
    public readonly userId: string,
    public readonly isbn: string,
    public readonly borrowDate: Date,
    public readonly dueDate: Date,
    public returnDate: Date | null,
    public status: LoanStatus
  ) {}

  public returnBook(date: Date): void {
    if (this.status !== LoanStatus.ACTIVE) {
      throw new Error('Loan is already returned or overdue processed');
    }
    
    this.returnDate = date;
    if (date > this.dueDate) {
      this.status = LoanStatus.OVERDUE;
    } else {
      this.status = LoanStatus.RETURNED;
    }
  }

  public static create(userId: string, isbn: string): Loan {
    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(borrowDate.getDate() + 1); // 1 day loan period (for testing/project presentation)
    
    return new Loan(
      crypto.randomUUID(),
      userId,
      isbn,
      borrowDate,
      dueDate,
      null,
      LoanStatus.ACTIVE
    );
  }
}
