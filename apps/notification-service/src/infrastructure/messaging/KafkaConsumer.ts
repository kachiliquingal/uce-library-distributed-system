import { Kafka } from 'kafkajs';
import { logger } from '../../utils/logger';
import { CreateNotificationUseCase } from '../../application/use-cases/CreateNotificationUseCase';
import { PostgresNotificationRepository } from '../database/PostgresNotificationRepository';
import { MqttPublisher } from './MqttPublisher';
import { EmailService } from '../email/EmailService';

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers,
});

const consumer = kafka.consumer({ groupId: 'notification-group' });
const repository = new PostgresNotificationRepository();
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

          const data = value.data || value; // Extract payload from nested 'data' property

          let userId = '';
          let subject = '';
          let body = '';

          switch (topic) {
            case 'user.registered':
              userId = String(data.id || data.userId);
              subject = 'Welcome to UCE Library!';
              body = `Hello ${data.firstName || data.name || 'User'}, your registration is complete. Welcome!`;
              break;
            case 'book.borrowed':
              userId = String(data.userId);
              subject = 'Book Borrowed Successfully';
              {
                const title = data.bookTitle || `con ISBN: ${data.isbn || data.bookId}`;
                const fac = data.faculty ? ` de la Facultad de ${data.faculty}` : '';
                const dateStr = data.borrowDate ? new Date(data.borrowDate).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }) : 'hoy';
                body = `Has solicitado el préstamo del libro "${title}" el ${dateStr}. Por favor acércate a la Biblioteca Central${fac} para retirar tu libro.`;
              }
              break;
            case 'book.returned':
              userId = String(data.userId);
              subject = 'Book Returned';
              {
                const title = data.bookTitle || `con ISBN: ${data.isbn || data.bookId}`;
                const dateStr = data.returnDate ? new Date(data.returnDate).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }) : 'hoy';
                body = `Gracias por devolver el libro "${title}" el ${dateStr}.`;
              }
              break;
            case 'fine.created':
              userId = String(data.userId);
              subject = 'New Fine Issued';
              body = `A fine of $${data.amount} has been applied to your account. Reason: ${data.reason}`;
              break;
          }

          if (userId && subject) {
            try {
              const notification = await createNotificationUseCase.execute(userId, 'EMAIL', subject, body);
              logger.info(`[Kafka] User notification created for userId: ${userId} - Subject: ${subject}`);
              
              // Push real-time and email
              MqttPublisher.publishNotification(userId, notification);
              await EmailService.sendNotificationEmail(subject, body, 'USER');
            } catch (err) {
              logger.error(`[Kafka] Failed to create user notification for userId: ${userId}`, err);
            }

            // Emit admin notification
            if (topic === 'book.borrowed' || topic === 'book.returned') {
              try {
                const action = topic === 'book.borrowed' ? 'solicitado el préstamo' : 'devuelto';
                const displayName = data.userName || userId;
                const adminSubject = 'Actividad del Sistema';
                
                const title = data.bookTitle || `con ISBN: ${data.isbn || data.bookId}`;
                const dateRaw = topic === 'book.borrowed' ? data.borrowDate : data.returnDate;
                const dateStr = dateRaw ? new Date(dateRaw).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }) : 'hoy';

                const adminBody = `El usuario ${displayName} ha ${action} del libro "${title}" el ${dateStr}.`;
                
                const adminNotification = await createNotificationUseCase.execute('ADMIN_NOTIFICATIONS', 'SYSTEM', adminSubject, adminBody);
                logger.info(`[Kafka] Admin notification created for action: ${action}`);

                // Push real-time and email to admin
                MqttPublisher.publishNotification('ADMIN_NOTIFICATIONS', adminNotification);
                await EmailService.sendNotificationEmail(adminSubject, adminBody, 'ADMIN');
              } catch (err) {
                logger.error(`[Kafka] Failed to create admin notification`, err);
              }
            }
          } else {
            logger.warn(`[Kafka] Missing userId or subject. Skipping notification creation for topic ${topic}`);
          }
        },
      });
    } catch (error) {
      logger.error('[Kafka] Consumer connection failed', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
