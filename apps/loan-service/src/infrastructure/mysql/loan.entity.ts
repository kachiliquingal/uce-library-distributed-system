import { Entity, PrimaryColumn, Column } from 'typeorm';
import { LoanStatus } from '../../domain/Loan';

@Entity('loans')
export class LoanEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  isbn!: string;

  @Column({ type: 'timestamp' })
  borrowDate!: Date;

  @Column({ type: 'timestamp' })
  dueDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnDate!: Date | null;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.ACTIVE })
  status!: LoanStatus;
}
