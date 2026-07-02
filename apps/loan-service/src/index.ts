import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { loanRouter } from './infrastructure/http/routes';
import { AppDataSource } from './infrastructure/mysql/data-source';
import { KafkaProducer, RabbitMQProducer } from './infrastructure/messaging/Producers';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';
const app = express();

import { logger } from './utils/logger';

app.use(cors());
app.use(express.json());

// Log incoming requests using winston directly
app.use((req, res, next) => {
  logger.info(`[Loan Service] Incoming Request: ${req.method} ${req.url}`);
  next();
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loan Service API',
      version: '1.0.0',
      description: 'API documentation for Loan Service',
    },
  },
  apis: ['./src/infrastructure/http/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);

app.use('/api/loans', loanRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'loan-service' });
});

const PORT = process.env.PORT || 3004;

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    logger.info('[Loan Service] Connected to MySQL via TypeORM');

    await KafkaProducer.connect();
    await KafkaConsumer.connect();
    await RabbitMQProducer.connect();

    app.listen(PORT, () => {
      logger.info(`[Loan Service] Server running on port ${PORT}`);
      logger.info(`[Loan Service] Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('[Loan Service] Failed to bootstrap', error);
    process.exit(1);
  }
}

bootstrap();
