import { Notification } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';

export class GetNotificationsUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async executeByUserId(userId: string): Promise<Notification[]> {
    return this.repository.findByUserId(userId);
  }

  async executeAll(): Promise<Notification[]> {
    return this.repository.findAll();
  }
}
