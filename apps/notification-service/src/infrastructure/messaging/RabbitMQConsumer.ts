import amqp from 'amqplib';
import { logger } from '../../utils/logger';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { SQLiteNotificationRepository } from '../database/SQLiteNotificationRepository';

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const queue = 'notifications.email';

const repository = new SQLiteNotificationRepository();
const createNotificationUseCase = new CreateNotificationUseCase(repository);

export class RabbitMQConsumer {
  static async connect() {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      
      await channel.assertQueue(queue, { durable: true });
      logger.info(`[RabbitMQ] Connected to ${rabbitUrl}, listening on queue: ${queue}`);

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            logger.info(`[RabbitMQ] Received message on queue ${queue}: ${msg.content.toString()}`);
            
            // Expected content: { userId, subject, body }
            if (content.userId && content.subject && content.body) {
              await createNotificationUseCase.execute(content.userId, 'EMAIL', content.subject, content.body);
            }
            channel.ack(msg);
          } catch (err) {
            logger.error(`[RabbitMQ] Error processing message`, err);
            // Requeue or dead-letter based on policies (here we just ack to not block for now)
            channel.ack(msg);
          }
        }
      });
    } catch (error) {
      logger.error('[RabbitMQ] Connection failed', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
