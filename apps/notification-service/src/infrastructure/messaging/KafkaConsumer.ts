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
      await consumer.subscribe({ topic: 'fine.paid', fromBeginning: true });
      await consumer.subscribe({ topic: 'reservation.created', fromBeginning: true });
      await consumer.subscribe({ topic: 'reservation.expired', fromBeginning: true });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          const value = JSON.parse(message.value.toString());
          logger.info(`[Kafka] Received event on topic ${topic}: ${JSON.stringify(value)}`);

          const data = value.payload || value.data || value; // Extract payload from nested property if wrapped

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
              subject = 'Notificación de Multa Generada';
              body = `Se ha generado una multa de $${data.amount} en su cuenta. Motivo: ${data.reason}. Por favor, ingrese al sistema para regularizar su estado.`;
              break;
            case 'fine.paid':
              userId = String(data.userId);
              subject = 'Confirmación de Pago de Multa';
              body = `Hemos recibido exitosamente su pago de $${data.amount} correspondiente a la multa generada. Gracias por regularizar su estado en UCE Library.`;
              break;
            case 'reservation.created':
              userId = String(data.userId);
              subject = `Confirmación de Reserva: ${data.roomName || 'Sala de Estudio'}`;
              {
                const roomStr = data.roomName || 'Sala de Estudio';
                const facStr = data.faculty ? ` (${data.faculty})` : '';
                const timeStr = (data.startTime && data.endTime) ? ` para el horario de ${data.startTime} a ${data.endTime}` : '';
                body = `¡Tu reserva en la ${roomStr}${facStr} ha sido confirmada${timeStr}! Cuentas con un turno asignado de 5 minutos exactos.`;
              }
              break;
            case 'reservation.expired':
              userId = String(data.userId);
              subject = `Turno Finalizado: ${data.roomName || 'Sala de Estudio'}`;
              {
                const roomStr = data.roomName || 'Sala de Estudio';
                const facStr = data.faculty ? ` (${data.faculty})` : '';
                body = `Tu tiempo asignado de 5 minutos en la ${roomStr}${facStr} ha terminado. Por favor abandona la sala para el siguiente turno.`;
              }
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
            if (topic === 'book.borrowed' || topic === 'book.returned' || topic === 'fine.created' || topic === 'fine.paid' || topic === 'reservation.created' || topic === 'reservation.expired') {
              try {
                let adminSubject = 'Actividad del Sistema';
                let adminBody = '';
                const displayName = data.userName || userId;
                
                if (topic === 'book.borrowed' || topic === 'book.returned') {
                  const action = topic === 'book.borrowed' ? 'solicitado el préstamo' : 'devuelto';
                  const title = data.bookTitle || `con ISBN: ${data.isbn || data.bookId}`;
                  const dateRaw = topic === 'book.borrowed' ? data.borrowDate : data.returnDate;
                  const dateStr = dateRaw ? new Date(dateRaw).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }) : 'hoy';
                  adminBody = `El usuario ${displayName} ha ${action} del libro "${title}" el ${dateStr}.`;
                } else if (topic === 'fine.created') {
                  adminSubject = 'Sistema de Multas: Nueva Multa';
                  adminBody = `El usuario ${displayName} ha sido multado por un valor de $${data.amount} debido a: ${data.reason}.`;
                } else if (topic === 'fine.paid') {
                  adminSubject = 'Sistema de Multas: Multa Pagada';
                  adminBody = `El usuario ${displayName} ha realizado el pago de su multa por un valor de $${data.amount} vía Stripe.`;
                } else if (topic === 'reservation.created') {
                  adminSubject = 'Control de Salas: Nueva Reserva';
                  adminBody = `El estudiante ${displayName} (${data.userEmail || userId}) ha reservado la "${data.roomName}" (${data.faculty}) para el horario de ${data.startTime} a ${data.endTime}.`;
                } else if (topic === 'reservation.expired') {
                  adminSubject = 'Control de Salas: Turno Liberado';
                  adminBody = `El turno de 5 minutos del estudiante ${displayName} en la "${data.roomName}" (${data.faculty}) ha concluido. Sala liberada automáticamente.`;
                }
                
                const adminNotification = await createNotificationUseCase.execute('ADMIN_NOTIFICATIONS', 'SYSTEM', adminSubject, adminBody);
                logger.info(`[Kafka] Admin notification created for topic: ${topic}`);

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
