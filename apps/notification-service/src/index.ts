import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { notificationRouter } from './infrastructure/http/routes';
import { initializeDB } from './infrastructure/database/db';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';
import { RabbitMQConsumer } from './infrastructure/messaging/RabbitMQConsumer';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());

// Log incoming requests using winston directly
app.use((req, res, next) => {
  logger.info(`[Notification Service] Incoming Request: ${req.method} ${req.url}`);
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'API documentation for Notification Service',
    },
  },
  apis: ['./src/infrastructure/http/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);

app.use('/api/notifications', notificationRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

const PORT = process.env.PORT || 3005;

async function bootstrap() {
  try {
    // Database connection is initialized upon import in db.ts
    await initializeDB();
    logger.info('[Notification Service] Initializing message consumers...');
    
    await KafkaConsumer.connect();
    await RabbitMQConsumer.connect();

    app.listen(PORT, () => {
      logger.info(`[Notification Service] Server running on port ${PORT}`);
      logger.info(`[Notification Service] Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('[Notification Service] Failed to bootstrap', error);
    process.exit(1);
  }
}

bootstrap();
