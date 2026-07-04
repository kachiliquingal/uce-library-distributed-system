import { Kafka, Consumer } from 'kafkajs';
import { logger } from '../../utils/logger';
import { ManageStockUseCase } from '../../application/use-cases/ManageStockUseCase';

export class KafkaConsumer {
  private consumer: Consumer;

  constructor(private readonly manageStockUseCase: ManageStockUseCase) {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
    const kafka = new Kafka({
      clientId: 'inventory-service',
      brokers: brokers
    });
    this.consumer = kafka.consumer({ groupId: 'inventory-service-group' });
  }

  public async start(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info(`[Kafka] Inventory Service connected to Kafka at ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);

      await this.consumer.subscribe({ topic: 'book.borrowed', fromBeginning: false });
      await this.consumer.subscribe({ topic: 'book.returned', fromBeginning: false });
      logger.info(`[Kafka] Subscribed to topics: book.borrowed, book.returned`);

      await this.consumer.run({
        eachMessage: async ({ topic, partition: _partition, message }) => {
          if (!message.value) return;

          const payloadStr = message.value.toString();
          logger.info(`[Kafka] Received message on topic ${topic}`);

          try {
            const payload = JSON.parse(payloadStr);
            const data = payload.data;

            if (!data || !data.isbn) {
              logger.warn(`[Kafka] Message on topic ${topic} missing isbn in data`);
              return;
            }

            switch (topic) {
              case 'book.borrowed':
                logger.info(`[Kafka] Processing book.borrowed for ISBN: ${data.isbn}`);
                await this.manageStockUseCase.reduceStock(data.isbn, 1);
                logger.info(`[Kafka] Successfully reduced stock for ISBN: ${data.isbn}`);
                break;
              case 'book.returned':
                logger.info(`[Kafka] Processing book.returned for ISBN: ${data.isbn}`);
                await this.manageStockUseCase.returnStock(data.isbn, 1);
                logger.info(`[Kafka] Successfully returned stock for ISBN: ${data.isbn}`);
                break;
              default:
                logger.warn(`[Kafka] Unhandled topic: ${topic}`);
            }
          } catch (err: any) {
            logger.error(`[Kafka] Error processing message from topic ${topic}:`, err.message || err);
          }
        }
      });
    } catch (error) {
      logger.error('[Kafka] Error starting Kafka consumer in inventory-service:', error);
    }
  }

  public async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
