import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bookRoutes from "./infrastructure/routes/bookRoutes";

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/catalog/books", bookRoutes);

import { KafkaProducer } from "./infrastructure/kafka/KafkaProducer";
import { GrpcServer } from "./infrastructure/grpc/GrpcServer";

// Database Connection
const initializeServices = async () => {
  try {
    const mongoUri = process.env.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    console.log("[Catalog Service] Connected to MongoDB successfully");

    // Connect to Kafka
    await KafkaProducer.getInstance().connect();

    // Start gRPC Server
    const grpcServer = new GrpcServer();
    grpcServer.start();

  } catch (error) {
    console.error("[Catalog Service] Initialization failed:", error);
    process.exit(1);
  }
};

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "catalog-service" });
});

// Start Server
app.listen(port, async () => {
  console.log(`[Catalog Service] Server running on port ${port}`);
  await initializeServices();
});
