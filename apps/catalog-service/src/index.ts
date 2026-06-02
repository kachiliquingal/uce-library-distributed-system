import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Initialize environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
const initializeDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI as string;
    await mongoose.connect(mongoUri);
    console.log("[Catalog Service] Connected to MongoDB successfully");
  } catch (error) {
    console.error("[Catalog Service] MongoDB connection failed:", error);
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
  await initializeDatabase();
});
