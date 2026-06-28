import { Router, Request, Response } from 'express';
import { GetNotificationsUseCase } from '../../application/use-cases/GetNotificationsUseCase';
import { SQLiteNotificationRepository } from '../database/SQLiteNotificationRepository';

export const notificationRouter = Router();
const repository = new SQLiteNotificationRepository();
const getNotificationsUseCase = new GetNotificationsUseCase(repository);

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
    res.json(notifications);
  } catch (error: any) {
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
    res.status(500).json({ error: error.message });
  }
});
