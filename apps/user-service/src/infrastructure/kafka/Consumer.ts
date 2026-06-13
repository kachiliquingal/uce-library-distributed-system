import { Kafka, Consumer } from "kafkajs";
import { UserUseCases } from "../../application/UserUseCases";

export class KafkaConsumerService {
  private consumer: Consumer;

  constructor(private userUseCases: UserUseCases) {
    const kafka = new Kafka({
      clientId: "user-service",
      brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
    });
    this.consumer = kafka.consumer({ groupId: "user-service-group" });
  }

  async connectAndSubscribe() {
    try {
      await this.consumer.connect();
      console.log("Connected to Kafka Consumer successfully.");

      await this.consumer.subscribe({ topic: "auth-events", fromBeginning: true });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          const msgString = message.value.toString();
          try {
            const data = JSON.parse(msgString);
            
            if (data.event === "user.registered") {
              const payload = data.payload;
              // Add user to Neo4j database
              await this.userUseCases.createUser({
                id: payload.id,
                email: payload.email,
                firstName: payload.firstName || "",
                lastName: payload.lastName || "",
                isActive: payload.isActive,
                roles: [] 
              });
              
              if (payload.role) {
                // Assign role (usually "USER" from Auth)
                await this.userUseCases.assignRole(payload.id, payload.role);
              }
              console.log(`[Kafka] Synced user.registered to Neo4j for email: ${payload.email}`);
            }
          } catch (err: any) {
            console.error("Error processing Kafka message:", err.message);
          }
        },
      });
    } catch (error) {
      console.error("Error connecting to Kafka Consumer:", error);
    }
  }
}
