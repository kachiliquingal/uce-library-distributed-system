import { Kafka } from 'kafkajs';
import { logger } from '../../utils/logger';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { SQLiteNotificationRepository } from '../database/SQLiteNotificationRepository';

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers,
});

const consumer = kafka.consumer({ groupId: 'notification-group' });
const repository = new SQLiteNotificationRepository();
const createNotificationUseCase = new CreateNotificationUseCase(repository);

export class KafkaConsumer {
  static async connect() {
    try {
      await consumer.connect();
      logger.info(`[Kafka] Connected to brokers: ${brokers.join(',')}`);

      await consumer.subscribe({ topic: 'user.registered', fromBeginning: true });
      await consumer.subscribe({ topic: 'book.borrowed', fromBeginning: true });
      await consumer.subscribe({ topic: 'book.returned', fromBeginning: true });
      await consumer.subscribe({ topic: 'fine.created', fromBeginning: true });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          const value = JSON.parse(message.value.toString());
          logger.info(`[Kafka] Received event on topic ${topic}: ${JSON.stringify(value)}`);

          let userId = '';
          let subject = '';
          let body = '';

          switch (topic) {
            case 'user.registered':
              userId = value.id;
              subject = 'Welcome to UCE Library!';
              body = `Hello ${value.name}, your registration is complete. Welcome!`;
              break;
            case 'book.borrowed':
              userId = value.userId;
              subject = 'Book Borrowed Successfully';
              body = `You have borrowed the book with ID: ${value.bookId}.`;
              break;
            case 'book.returned':
              userId = value.userId;
              subject = 'Book Returned';
              body = `Thank you for returning the book with ID: ${value.bookId}.`;
              break;
            case 'fine.created':
              userId = value.userId;
              subject = 'New Fine Issued';
              body = `A fine of $${value.amount} has been applied to your account. Reason: ${value.reason}`;
              break;
          }

          if (userId && subject) {
            await createNotificationUseCase.execute(userId, 'EMAIL', subject, body);
          }
        },
      });
    } catch (error) {
      logger.error('[Kafka] Consumer connection failed', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
