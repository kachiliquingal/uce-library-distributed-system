import { Router, Request, Response } from 'express';
import { GetNotificationsUseCase } from '../../application/use-cases/GetNotificationsUseCase';
import { MarkNotificationsAsReadUseCase } from '../../application/use-cases/MarkNotificationsAsReadUseCase';
import { SQLiteNotificationRepository } from '../database/SQLiteNotificationRepository';
import { logger } from '../../utils/logger';

export const notificationRouter = Router();
const repository = new SQLiteNotificationRepository();
const getNotificationsUseCase = new GetNotificationsUseCase(repository);
const markNotificationsAsReadUseCase = new MarkNotificationsAsReadUseCase(repository);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve a list of all notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: A list of notifications.
 */
notificationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await getNotificationsUseCase.executeAll();
    logger.info(`[NotificationService] Retrieved all notifications`);
    res.json(notifications);
  } catch (error: any) {
    logger.error(`[NotificationService] Error retrieving all notifications:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Retrieve notifications for a specific user
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A list of notifications for the user.
 */
notificationRouter.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const notifications = await getNotificationsUseCase.executeByUserId(userId);
    res.json(notifications);
  } catch (error: any) {
    logger.error(`[NotificationService] Error retrieving notifications for user ${req.params.userId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/notifications/user/{userId}/read:
 *   put:
 *     summary: Mark all notifications for a specific user as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Notifications marked as read.
 */
notificationRouter.put('/user/:userId/read', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    await markNotificationsAsReadUseCase.execute(userId);
    res.json({ message: 'Notifications marked as read' });
  } catch (error: any) {
    logger.error(`[NotificationService] Error marking notifications as read for user ${req.params.userId}:`, error);
    res.status(500).json({ error: error.message });
  }
});
