import { NotificationRepository } from '../../domain/repositories/NotificationRepository';
import { logger } from '../../utils/logger';

export class MarkNotificationsAsReadUseCase {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(userId: string): Promise<void> {
    logger.info(`[MarkNotificationsAsReadUseCase] Marking notifications as read for user ${userId}`);
    
    // Si el repositorio no implementa markAllAsRead explícitamente pero sí en el SQLite, lo usamos
    if ('markAllAsRead' in this.notificationRepository) {
      await (this.notificationRepository as any).markAllAsRead(userId);
    } else {
      // Fallback
      const notifications = await this.notificationRepository.findByUserId(userId);
      for (const notif of notifications) {
        if (notif.status === 'SENT') {
          await this.notificationRepository.updateStatus(notif.id, 'READ');
        }
      }
    }
    
    logger.info(`[MarkNotificationsAsReadUseCase] Successfully marked notifications as read for user ${userId}`);
  }
}
