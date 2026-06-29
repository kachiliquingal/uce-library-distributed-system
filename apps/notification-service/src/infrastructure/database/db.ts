import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '../../../data/notifications.db');

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new Database(dbPath);

// Initialize schema
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt DATETIME NOT NULL,
      sentAt DATETIME
    )
  `);
  logger.info('[SQLite] Notification table initialized.');
} catch (error) {
  logger.error('[SQLite] Failed to initialize table', error);
}
