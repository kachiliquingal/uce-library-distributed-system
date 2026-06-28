import { Notification, NotificationType } from '../../domain/entities/Notification';
import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

export class CreateNotificationUseCase {
  constructor(private readonly repository: NotificationRepository) {}

  async execute(userId: string, type: NotificationType, subject: string, message: string): Promise<void> {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type,
      subject,
      message,
      status: 'SENT',
      createdAt: new Date(),
      sentAt: new Date()
    };

    await this.repository.save(notification);
    logger.info(`[NotificationService] Notification saved for user ${userId} - Subject: ${subject}`);
  }
}
