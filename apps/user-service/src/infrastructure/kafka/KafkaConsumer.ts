import { Kafka, Consumer } from "kafkajs";
import { UserUseCases } from "../../application/UserUseCases";
import { logger } from "../../utils/logger";

export class KafkaConsumerService {
  private static instance: KafkaConsumerService;
  private consumer: Consumer;
  private userUseCases: UserUseCases | null = null;

  private constructor() {
    const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];
    const kafka = new Kafka({
      clientId: "user-service-consumer",
      brokers: brokers,
    });
    // Create a consumer group specific to this service
    this.consumer = kafka.consumer({ groupId: "user-service-group" });
  }

  public static getInstance(): KafkaConsumerService {
    if (!KafkaConsumerService.instance) {
      KafkaConsumerService.instance = new KafkaConsumerService();
    }
    return KafkaConsumerService.instance;
  }

  public setUserUseCases(userUseCases: UserUseCases) {
    this.userUseCases = userUseCases;
  }

  public async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      logger.info(`[Kafka Consumer] Connected to Kafka at ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
    } catch (error) {
      logger.error("[Kafka Consumer] Connection error:", error);
    }
  }

  public async subscribe(): Promise<void> {
    try {
      // Subscribe to user.registered event emitted by auth-service
      await this.consumer.subscribe({ topic: "user.registered", fromBeginning: true });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          
          try {
            const eventPayload = JSON.parse(message.value.toString());
            logger.info(`[Kafka Consumer] Received event from ${topic}:`, eventPayload.event);

            if (eventPayload.event === "UserRegistered" && this.userUseCases) {
              const userData = eventPayload.data;
              logger.info(`[Kafka Consumer] Processing UserRegistered for email: ${userData.email}`);
              
              // Map auth-service data to user-service Neo4j format
              await this.userUseCases.createUser({
                id: userData.userId?.toString(),
                email: userData.email,
                firstName: userData.email.split('@')[0], // Fallback if no name provided
                lastName: "",
                isActive: true,
                roles: []
              });

              // Assign the role emitted by auth-service
              if (userData.role) {
                await this.userUseCases.assignRole(userData.userId?.toString(), userData.role);
                logger.info(`[Kafka Consumer] Assigned role ${userData.role} to user ${userData.userId}`);
              }
            }
          } catch (error) {
            logger.error(`[Kafka Consumer] Error processing message from topic ${topic}:`, error);
          }
        },
      });
      logger.info("[Kafka Consumer] Subscribed to topics successfully");
    } catch (error) {
      logger.error("[Kafka Consumer] Error subscribing to topics:", error);
    }
  }

  public async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}
