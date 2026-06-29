import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { db } from './db';
import { logger } from '../../utils/logger';

export class SQLiteNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT INTO notifications (id, userId, type, subject, message, status, createdAt, sentAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        notification.id,
        notification.userId,
        notification.type,
        notification.subject,
        notification.message,
        notification.status,
        notification.createdAt.toISOString(),
        notification.sentAt ? notification.sentAt.toISOString() : null
      );
    } catch (error) {
      logger.error('[SQLite] Error saving notification', error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    try {
      const stmt = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC');
      const rows = stmt.all(userId) as any[];
      return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        sentAt: row.sentAt ? new Date(row.sentAt) : undefined
      }));
    } catch (error) {
      logger.error(`[SQLite] Error finding notifications for user ${userId}`, error);
      return [];
    }
  }

  async findAll(): Promise<Notification[]> {
    try {
      const stmt = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC');
      const rows = stmt.all() as any[];
      return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
        sentAt: row.sentAt ? new Date(row.sentAt) : undefined
      }));
    } catch (error) {
      logger.error('[SQLite] Error finding all notifications', error);
      return [];
    }
  }

  async updateStatus(id: string, status: string): Promise<void> {
    try {
      const stmt = db.prepare('UPDATE notifications SET status = ? WHERE id = ?');
      stmt.run(status, id);
    } catch (error) {
      logger.error(`[SQLite] Error updating status for notification ${id}`, error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const stmt = db.prepare("UPDATE notifications SET status = 'READ' WHERE userId = ? AND status = 'SENT'");
      stmt.run(userId);
    } catch (error) {
      logger.error(`[SQLite] Error marking all notifications as read for user ${userId}`, error);
    }
  }
}
