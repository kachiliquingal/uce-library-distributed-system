import { Notification } from '../entities/Notification';

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  findByUserId(userId: string): Promise<Notification[]>;
  findAll(): Promise<Notification[]>;
  updateStatus(id: string, status: string): Promise<void>;
}
