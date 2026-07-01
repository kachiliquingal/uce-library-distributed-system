import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { logger } from './utils/logger';
import { swaggerSpec } from './infrastructure/swagger/config';
import { createSearchRoutes } from './infrastructure/http/routes';
import { metricsClient, metricsMiddleware } from './infrastructure/http/metrics';

// Infrastructure
import { ElasticsearchSearchRepository } from './infrastructure/database/ElasticsearchSearchRepository';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';

// Use Cases
import { SearchBooksUseCase } from './application/use-cases/SearchBooksUseCase';
import { GetSuggestionsUseCase } from './application/use-cases/GetSuggestionsUseCase';
import { IndexBookUseCase } from './application/use-cases/IndexBookUseCase';
import { UpdateBookIndexUseCase } from './application/use-cases/UpdateBookIndexUseCase';
import { SyncHistoricalBooksUseCase } from './application/use-cases/SyncHistoricalBooksUseCase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'search-service' });
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsClient.register.contentType);
    res.end(await metricsClient.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Swagger Documentation
app.use('/api/search/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function bootstrap() {
  try {
    // 1. Initialize Repository
    const searchRepository = new ElasticsearchSearchRepository();
    
    // Wait a bit for Elasticsearch to be fully ready
    logger.info('Waiting for Elasticsearch to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await searchRepository.initializeIndex();

    // 2. Initialize Use Cases
    const searchBooksUseCase = new SearchBooksUseCase(searchRepository);
    const getSuggestionsUseCase = new GetSuggestionsUseCase(searchRepository);
    const indexBookUseCase = new IndexBookUseCase(searchRepository);
    const updateBookIndexUseCase = new UpdateBookIndexUseCase(searchRepository);
    const syncHistoricalBooksUseCase = new SyncHistoricalBooksUseCase(searchRepository);

    // 3. Initialize Express Routes
    app.use('/api/search', createSearchRoutes(searchBooksUseCase, getSuggestionsUseCase));

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      logger.info(`[Server] Search Service is running on port ${PORT}`);
      logger.info(`[Swagger] Documentation available at /api-docs`);
    });

    // 5. Initial Data Hydration (Sync existing books from Catalog)
    // Run this in the background so it doesn't block startup
    syncHistoricalBooksUseCase.execute().catch(err => {
      logger.error('Initial sync failed:', err);
    });

    // 6. Initialize Kafka Consumer
    const kafkaConsumer = new KafkaConsumer(indexBookUseCase, updateBookIndexUseCase);
    await kafkaConsumer.start();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received. Shutting down gracefully...');
      await kafkaConsumer.stop();
      process.exit(0);
    });
    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received. Shutting down gracefully...');
      await kafkaConsumer.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to bootstrap Search Service:', error);
    process.exit(1);
  }
}

bootstrap();
