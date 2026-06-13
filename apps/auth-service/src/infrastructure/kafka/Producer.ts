import { Kafka, Producer } from "kafkajs";

class KafkaProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: "auth-service",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    });
    this.producer = kafka.producer();
  }

  async connect() {
    try {
      await this.producer.connect();
      console.log("Connected to Kafka Producer successfully.");
    } catch (error) {
      console.error("Error connecting to Kafka Producer:", error);
    }
  }

  async publish(topic: string, message: any) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      console.log(`Event published to topic ${topic}`);
    } catch (error) {
      console.error(`Error publishing to topic ${topic}:`, error);
    }
  }
}

export const kafkaProducer = new KafkaProducer();
