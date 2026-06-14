import { Kafka, Producer } from 'kafkajs';

export class KafkaProducer {
  private static instance: KafkaProducer;
  private producer: Producer;

  private constructor() {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
    const kafka = new Kafka({
      clientId: 'auth-service',
      brokers: brokers
    });
    this.producer = kafka.producer();
  }

  public static getInstance(): KafkaProducer {
    if (!KafkaProducer.instance) {
      KafkaProducer.instance = new KafkaProducer();
    }
    return KafkaProducer.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.producer.connect();
      console.log(`[Kafka] Auth Service connected to Kafka at ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
    } catch (error) {
      console.error('[Kafka] Error connecting Auth Service to Kafka:', error);
    }
  }

  public async emitEvent(topic: string, eventName: string, payload: any): Promise<void> {
    try {
      const message = {
        value: JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          data: payload
        })
      };
      await this.producer.send({
        topic,
        messages: [message]
      });
      console.log(`[Kafka] Event emitted: ${eventName} -> Topic: ${topic}`);
    } catch (error) {
      console.error(`[Kafka] Failed to emit event ${eventName}:`, error);
    }
  }

  public async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
