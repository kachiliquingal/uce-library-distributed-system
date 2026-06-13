import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "redis";
import { createAuthRouter } from "./infrastructure/routes/authRoutes";
import { kafkaProducer } from "./infrastructure/kafka/Producer";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connections
const pgClient = new Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
});

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

const initializeDatabases = async () => {
  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log("[Auth Service] Connected to PostgreSQL successfully.");

    // Create Users Table if not exists
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'USER'
      );
    `);
    console.log("[Auth Service] Users table verified in PostgreSQL.");

    // Connect to Redis
    await redisClient.connect();
    console.log("[Auth Service] Connected to Redis successfully.");
  } catch (error) {
    console.error("[Auth Service] Database connection failed:", error);
    process.exit(1);
  }
};

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

// --- HERE WE CONNECT HEXAGONAL ARCHITECTURE ---
// Mount Auth Routes
app.use("/api/auth", createAuthRouter(pgClient));

// Start Server
app.listen(port, async () => {
  console.log(`[Auth Service] Server running on port ${port}`);
  await initializeDatabases();
  await kafkaProducer.connect();
});
