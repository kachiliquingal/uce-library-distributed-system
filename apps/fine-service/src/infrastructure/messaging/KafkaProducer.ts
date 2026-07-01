import { Kafka } from 'kafkajs';
import { logger } from '../../utils/logger';

const kafka = new Kafka({
  clientId: 'fine-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

export class KafkaProducer {
  static async connect() {
    try {
      await producer.connect();
      logger.info('[KafkaProducer] Connected to Kafka');
    } catch (error) {
      logger.error('[KafkaProducer] Failed to connect to Kafka', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  static async emit(topic: string, data: any) {
    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(data) }],
      });
      logger.info(`[KafkaProducer] Emitted event to topic ${topic}`);
    } catch (error) {
      logger.error(`[KafkaProducer] Failed to emit event to topic ${topic}`, error);
    }
  }
}
