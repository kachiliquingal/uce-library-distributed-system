import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./infrastructure/http/routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import { swaggerSpec } from "./infrastructure/swagger/config";
import swaggerUi from "swagger-ui-express";

app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "user-service" });
});

import { startGrpcServer } from "./infrastructure/grpc/server";
import { UserUseCases } from "./application/UserUseCases";
import { Neo4jUserRepository } from "./infrastructure/neo4j/Neo4jUserRepository";
import { KafkaConsumerService } from "./infrastructure/kafka/Consumer";

const PORT = process.env.PORT || 3003;

app.listen(PORT, async () => {
  console.log(`User Service running on port ${PORT}`);
  
  const userRepository = new Neo4jUserRepository();
  const userUseCases = new UserUseCases(userRepository);
  startGrpcServer(userUseCases);

  const kafkaConsumer = new KafkaConsumerService(userUseCases);
  await kafkaConsumer.connectAndSubscribe();
});
