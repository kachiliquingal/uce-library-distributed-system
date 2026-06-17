import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bookRoutes from "./infrastructure/routes/bookRoutes";
import { logger } from "./utils/logger";

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./infrastructure/swagger/config";

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/catalog/books", bookRoutes);

import { KafkaProducer } from "./infrastructure/kafka/KafkaProducer";
import { GrpcServer } from "./infrastructure/grpc/GrpcServer";

// Database Connection
const initializeServices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    logger.info("[Catalog Service] Connected to MongoDB successfully");

    // Connect to Kafka
    await KafkaProducer.getInstance().connect();

    // Start gRPC Server
    const grpcServer = new GrpcServer();
    grpcServer.start();

  } catch (error) {
    logger.error("[Catalog Service] Initialization failed:", error);
    process.exit(1);
  }
};

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "catalog-service" });
});

// Start Server
app.listen(port, async () => {
  logger.info(`[Catalog Service] Server running on port ${port}`);
  await initializeServices();
});
