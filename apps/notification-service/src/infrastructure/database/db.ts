import { Pool } from 'pg';
import { logger } from '../../utils/logger';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL,
        "sentAt" TIMESTAMP
      )
    `);
    logger.info('[Postgres] Notification table initialized.');
  } catch (error) {
    logger.error('[Postgres] Failed to initialize table', error);
  }
};
