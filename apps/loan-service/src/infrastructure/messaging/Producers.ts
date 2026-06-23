import { Kafka } from 'kafkajs';
import * as amqp from 'amqplib';

const kafka = new Kafka({
  clientId: 'loan-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

export class KafkaProducer {
  static async connect() {
    await producer.connect();
    console.log('Connected to Kafka (Producer)');
  }

  static async emit(topic: string, eventName: string, data: any) {
    try {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify({ event: eventName, data, timestamp: new Date() }) }],
      });
      console.log(`Kafka event emitted: ${eventName} to topic ${topic}`);
    } catch (error) {
      console.error(`Failed to emit Kafka event ${eventName}`, error);
    }
  }
}

let rmqChannel: amqp.Channel;

export class RabbitMQProducer {
  static async connect() {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      rmqChannel = await connection.createChannel();
      await rmqChannel.assertQueue('fine.trigger', { durable: true, arguments: { 'x-dead-letter-exchange': 'library.dlx', 'x-dead-letter-routing-key': 'fine.trigger.dlq' } });
      console.log('Connected to RabbitMQ (Producer)');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
    }
  }

  static emit(queue: string, data: any) {
    if (!rmqChannel) return;
    try {
      rmqChannel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), { persistent: true });
      console.log(`RabbitMQ event emitted to queue ${queue}`);
    } catch (error) {
      console.error(`Failed to emit to RabbitMQ queue ${queue}`, error);
    }
  }
}
