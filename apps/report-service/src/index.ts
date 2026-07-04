import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger';
import { swaggerSpec } from './infrastructure/swagger/config';
import reportRoutes, { analyticsUseCase } from './infrastructure/http/routes';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4007;

app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', service: 'report-service', timestamp: new Date() });
});

const kafkaConsumer = new KafkaConsumer(analyticsUseCase);

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Report Service listening on port ${PORT}`);
      logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
      logger.info(`GraphQL endpoint available at http://localhost:${PORT}/api/reports/graphql`);
    });

    // Start Kafka consumer in background
    await kafkaConsumer.start();
  } catch (error) {
    logger.error('Failed to start Report Service:', error);
    process.exit(1);
  }
};

startServer();
