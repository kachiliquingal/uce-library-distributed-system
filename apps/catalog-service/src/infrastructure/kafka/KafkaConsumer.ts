import { Kafka } from "kafkajs";
import { BookModel } from "../database/BookModel";

const kafka = new Kafka({
  clientId: "catalog-service",
  brokers: [(process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER) || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "catalog-service-group" });

export class KafkaConsumer {
  static async start() {
    try {
      await consumer.connect();
      console.log("Kafka Consumer connected successfully (Catalog Service)");

      await consumer.subscribe({ topic: "book.borrowed", fromBeginning: false });
      await consumer.subscribe({ topic: "book.returned", fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;

          try {
            const eventData = JSON.parse(message.value.toString());

            if (topic === "book.borrowed") {
              const { isbn } = eventData;
              console.log(`[Kafka] Processing book.borrowed event for ISBN: ${isbn}`);
              await BookModel.updateOne({ isbn }, { available: false });
              console.log(`[Kafka] Book ISBN: ${isbn} marked as not available.`);
            }

            if (topic === "book.returned") {
              const { isbn } = eventData;
              console.log(`[Kafka] Processing book.returned event for ISBN: ${isbn}`);
              await BookModel.updateOne({ isbn }, { available: true });
              console.log(`[Kafka] Book ISBN: ${isbn} marked as available.`);
            }
          } catch (err) {
            console.error("[Kafka] Error processing message:", err);
          }
        },
      });
    } catch (error) {
      console.error("Error starting Kafka consumer in Catalog Service:", error);
    }
  }
}
