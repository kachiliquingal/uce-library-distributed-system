import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { pool } from './db';

export class PostgresNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    const query = `
      INSERT INTO notifications (id, "userId", type, subject, message, status, "createdAt", "sentAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        "sentAt" = EXCLUDED."sentAt"
    `;
    const values = [
      notification.id,
      notification.userId,
      notification.type,
      notification.subject,
      notification.message,
      notification.status,
      notification.createdAt,
      notification.sentAt || null,
    ];
    await pool.query(query, values);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const result = await pool.query('SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC', [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.createdAt),
      sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    }));
  }

  async findAll(): Promise<Notification[]> {
    const result = await pool.query('SELECT * FROM notifications ORDER BY "createdAt" DESC');
    return result.rows.map(row => ({
      id: row.id,
      userId: row.userId,
      type: row.type,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.createdAt),
      sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    }));
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE notifications SET status = $1, "sentAt" = $2 WHERE id = $3', [status, status === 'SENT' ? new Date() : null, id]);
  }
}
