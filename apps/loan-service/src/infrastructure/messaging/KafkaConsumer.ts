import { Kafka } from 'kafkajs';
import { logger } from '../../utils/logger';
import { MarkLoanAsReturnedUseCase } from '../../application/use-cases/LoanUseCases';
import { LoanRepositoryImpl } from '../mysql/LoanRepositoryImpl';

const kafka = new Kafka({
  clientId: 'loan-service-consumer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'loan-service-group' });
const loanRepository = new LoanRepositoryImpl();
const markLoanAsReturnedUseCase = new MarkLoanAsReturnedUseCase(loanRepository);

export class KafkaConsumer {
  static async connect() {
    try {
      await consumer.connect();
      logger.info('[KafkaConsumer] Connected to Kafka');

      await consumer.subscribe({ topic: 'fine.paid', fromBeginning: false });
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;
            const event = JSON.parse(message.value.toString());
            
            if (topic === 'fine.paid' && event.data?.loanId) {
              logger.info(`[KafkaConsumer] Processing fine.paid for loanId ${event.data.loanId}`);
              await markLoanAsReturnedUseCase.execute(event.data.loanId);
            }
          } catch (error) {
            logger.error(`[KafkaConsumer] Error processing message on topic ${topic}`, error);
          }
        },
      });
    } catch (error) {
      logger.error('[KafkaConsumer] Failed to connect', error);
      setTimeout(() => this.connect(), 5000);
    }
  }
}
