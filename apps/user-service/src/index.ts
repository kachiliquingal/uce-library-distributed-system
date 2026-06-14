import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as userRoutes } from "./infrastructure/http/routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./infrastructure/swagger/config";

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import { KafkaProducer } from "./infrastructure/kafka/KafkaProducer";
import { GrpcServer } from "./infrastructure/grpc/GrpcServer";

app.listen(port, async () => {
  console.log(`[User Service] Server is running on port ${port}`);
  console.log(`[User Service] Swagger docs at http://localhost:${port}/api-docs`);
  
  // Connect to Kafka
  await KafkaProducer.getInstance().connect();

  // Start gRPC Server
  const grpcServer = new GrpcServer();
  grpcServer.start();
});
