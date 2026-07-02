import { Pool } from 'pg';
import { Fine } from '../../domain/Fine';
import { FineRepository } from '../../domain/FineRepository';
import { logger } from '../../utils/logger';

export class PostgresFineRepository implements FineRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT) || 5432,
    });
    this.initialize();
  }

  private async initialize() {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS fines (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          loan_id VARCHAR(36) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          reason TEXT NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
          stripe_payment_intent_id VARCHAR(255),
          created_at TIMESTAMP NOT NULL
        );
      `);
      logger.info('[PostgresFineRepository] Table "fines" is ready');
    } catch (error) {
      logger.error('[PostgresFineRepository] Error initializing table:', error);
    }
  }

  async save(fine: Fine): Promise<void> {
    await this.pool.query(
      `INSERT INTO fines (id, user_id, loan_id, amount, reason, status, stripe_payment_intent_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [fine.id, fine.userId, fine.loanId, fine.amount, fine.reason, fine.status, fine.stripePaymentIntentId, fine.createdAt]
    );
  }

  async findById(id: string): Promise<Fine | null> {
    const res = await this.pool.query('SELECT * FROM fines WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.mapToEntity(res.rows[0]);
  }

  async findByUserId(userId: string): Promise<Fine[]> {
    const res = await this.pool.query('SELECT * FROM fines WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(this.mapToEntity);
  }

  async findAll(): Promise<Fine[]> {
    const res = await this.pool.query('SELECT * FROM fines ORDER BY created_at DESC');
    return res.rows.map(this.mapToEntity);
  }

  async update(fine: Fine): Promise<void> {
    await this.pool.query(
      `UPDATE fines SET status = $1, stripe_payment_intent_id = $2 WHERE id = $3`,
      [fine.status, fine.stripePaymentIntentId, fine.id]
    );
  }

  private mapToEntity(row: any): Fine {
    return new Fine(
      row.id,
      row.user_id,
      row.loan_id,
      parseFloat(row.amount),
      row.reason,
      row.status,
      row.created_at,
      row.stripe_payment_intent_id
    );
  }
}
