import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { logger } from '../../utils/logger';
import { AnalyticsUseCase } from '../../application/use-cases/AnalyticsUseCase';

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isRunning: boolean = false;

  constructor(private analyticsUseCase: AnalyticsUseCase) {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
    this.kafka = new Kafka({
      clientId: 'report-service',
      brokers
    });
    this.consumer = this.kafka.consumer({ groupId: 'report-service-group' });
  }

  async start(): Promise<void> {
    try {
      logger.info('Connecting to Kafka broker for Report Service...');
      await this.consumer.connect();
      
      const topics = [
        'book.borrowed',
        'book.returned',
        'book.added',
        'book.updated',
        'user.registered',
        'fine.created',
        'fine.paid'
      ];

      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      this.isRunning = true;
      logger.info(`Report Service subscribed to Kafka topics: ${topics.join(', ')}`);

      await this.consumer.run({
        eachMessage: async ({ topic, message }: { topic: string; message: KafkaMessage }) => {
          try {
            const value = message.value?.toString();
            if (!value) return;

            const payload = JSON.parse(value);
            logger.info(`Received event on [${topic}]:`, payload);

            if (topic === 'book.borrowed' || topic === 'book.returned') {
              await this.analyticsUseCase.recordEvent('loans', {
                bookId: String(payload.bookId || 'unknown'),
                userId: String(payload.userId || 'unknown'),
                action: topic.split('.')[1]
              }, { count: 1 });
            } else if (topic === 'book.added' || topic === 'book.updated') {
              await this.analyticsUseCase.recordEvent('catalog', {
                bookId: String(payload.id || payload.bookId || 'unknown'),
                action: topic.split('.')[1]
              }, { count: 1 });
            } else if (topic === 'user.registered') {
              await this.analyticsUseCase.recordEvent('user_activity', {
                userId: String(payload.id || payload.userId || 'unknown'),
                action: 'registered'
              }, { count: 1 });
            } else if (topic === 'fine.created' || topic === 'fine.paid') {
              await this.analyticsUseCase.recordEvent('fines', {
                userId: String(payload.userId || 'unknown'),
                status: topic === 'fine.paid' ? 'PAID' : 'PENDING'
              }, { amount: Number(payload.amount || 5.00), count: 1 });
            }
          } catch (error) {
            logger.error(`Error processing Kafka message on topic [${topic}]:`, error);
          }
        }
      });
    } catch (error) {
      logger.error('Failed to start Kafka consumer in Report Service:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.consumer.disconnect();
      this.isRunning = false;
      logger.info('Kafka consumer disconnected.');
    }
  }
}
