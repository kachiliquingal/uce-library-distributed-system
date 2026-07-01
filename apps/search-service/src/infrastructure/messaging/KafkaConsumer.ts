import { Kafka, Consumer } from 'kafkajs';
import { logger } from '../../utils/logger';
import { IndexBookUseCase } from '../../application/use-cases/IndexBookUseCase';
import { UpdateBookIndexUseCase } from '../../application/use-cases/UpdateBookIndexUseCase';

export class KafkaConsumer {
  private consumer: Consumer;

  constructor(
    private readonly indexBookUseCase: IndexBookUseCase,
    private readonly updateBookIndexUseCase: UpdateBookIndexUseCase
  ) {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
    const kafka = new Kafka({
      clientId: 'search-service',
      brokers: brokers
    });
    this.consumer = kafka.consumer({ groupId: 'search-service-group' });
  }

  public async start(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info(`[Kafka] Search Service connected to Kafka at ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);

      // Subscribe to catalog events
      await this.consumer.subscribe({ topic: 'book.added', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'book.updated', fromBeginning: false });
      logger.info(`[Kafka] Subscribed to topics: book.added, book.updated`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;

          const payloadStr = message.value.toString();
          logger.info(`[Kafka] Received message on topic ${topic}`);

          try {
            const payload = JSON.parse(payloadStr);
            const data = payload.data; // Usually { event: 'book.added', data: { ... } }

            switch (topic) {
              case 'book.added':
                logger.info(`[Kafka] Processing book.added for ISBN: ${data.isbn}`);
                await this.indexBookUseCase.execute(data);
                break;
              case 'book.updated':
                logger.info(`[Kafka] Processing book.updated for ISBN: ${data.isbn}`);
                await this.updateBookIndexUseCase.execute(data.isbn, data);
                break;
              default:
                logger.warn(`[Kafka] Unhandled topic: ${topic}`);
            }
          } catch (err) {
            logger.error(`[Kafka] Error processing message from topic ${topic}:`, err);
          }
        }
      });
    } catch (error) {
      logger.error('[Kafka] Error starting Kafka consumer:', error);
    }
  }

  public async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
