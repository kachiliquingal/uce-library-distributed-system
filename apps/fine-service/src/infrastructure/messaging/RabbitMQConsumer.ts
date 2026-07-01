import amqp from 'amqplib';
import { logger } from '../../utils/logger';
import { CreateFineUseCase } from '../../application/use-cases/CreateFineUseCase';
import { PostgresFineRepository } from '../database/PostgresFineRepository';
import { KafkaProducer } from './KafkaProducer';

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const queue = 'fine.trigger';

const repository = new PostgresFineRepository();
const createFineUseCase = new CreateFineUseCase(repository);

export class RabbitMQConsumer {
  static async connect() {
    try {
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();
      
      await channel.assertQueue(queue, { durable: true, arguments: { 'x-dead-letter-exchange': 'library.dlx', 'x-dead-letter-routing-key': 'fine.trigger.dlq' } });
      logger.info(`[RabbitMQ] Connected to ${rabbitUrl}, listening on queue: ${queue}`);

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            logger.info(`[RabbitMQ] Received fine.trigger message for loanId: ${content.loanId}`);
            
            // Standard fine amount for late returns (e.g., $5.00)
            const fineAmount = 5.00;
            
            const fine = await createFineUseCase.execute(
              content.userId,
              content.loanId,
              fineAmount,
              content.reason || 'Devolución tardía de libro'
            );
            
            // Emit to Kafka so Notification Service can send email
            await KafkaProducer.emit('fine.created', {
              userId: fine.userId,
              amount: fine.amount,
              reason: fine.reason,
              fineId: fine.id
            });
            
            channel.ack(msg);
          } catch (err) {
            logger.error(`[RabbitMQ] Error processing message`, err);
            // Requeue or dead-letter
            channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      logger.error('[RabbitMQ] Connection failed', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
