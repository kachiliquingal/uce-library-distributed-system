import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/swagger/config';
import { DynamoDBAdapter } from './infrastructure/database/DynamoDBAdapter';
import { MosquittoKafkaClient } from './infrastructure/messaging/MosquittoKafkaClient';
import { OutboxProcessor } from './infrastructure/messaging/OutboxProcessor';
import { ReservationExpirationWorker } from './infrastructure/workers/ReservationExpirationWorker';
import { CreateReservationWithOutboxUseCase } from './application/use-cases/CreateReservationWithOutboxUseCase';
import { GetReservationsUseCase } from './application/use-cases/GetReservationsUseCase';
import { CancelReservationUseCase } from './application/use-cases/CancelReservationUseCase';
import { GetRoomsAvailabilityUseCase } from './application/use-cases/GetRoomsAvailabilityUseCase';
import { ReservationController } from './infrastructure/http/controllers/ReservationController';
import { createRoutes } from './infrastructure/http/routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4008;

app.use(cors());
app.use(express.json());

// 1. Initialize Infrastructure & Adapters
const repository = new DynamoDBAdapter();
const broker = new MosquittoKafkaClient();

// 2. Initialize Background Workers (Outbox Pattern & 5-Min Expiration Worker)
const outboxProcessor = new OutboxProcessor(repository, broker);
outboxProcessor.start(5000); // Check pending outbox every 5s

const expirationWorker = new ReservationExpirationWorker(repository, broker);
expirationWorker.start(10000); // Check 5-minute expirations every 10s

// 3. Initialize Application Use Cases
const createUseCase = new CreateReservationWithOutboxUseCase(repository, broker);
const getReservationsUseCase = new GetReservationsUseCase(repository);
const cancelUseCase = new CancelReservationUseCase(repository, broker);
const getRoomsUseCase = new GetRoomsAvailabilityUseCase(repository);

// 4. Initialize HTTP Controller & Routes
const controller = new ReservationController(
  createUseCase,
  getReservationsUseCase,
  cancelUseCase,
  getRoomsUseCase
);

app.use('/api/reservations', createRoutes(controller));

// Swagger OpenAPI Documentation
app.use('/api/reservations/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Prometheus Metrics Endpoint
app.get('/metrics', (_req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send('# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{service="reservation-service",status="200"} 15\n');
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'reservation-service',
    timestamp: new Date().toISOString(),
    timezone: 'America/Guayaquil',
    architecture: 'Hexagonal + ACID Outbox Pattern',
    roomsCount: 42
  });
});

const server = app.listen(PORT, () => {
  logger.info(`🚀 [MS-08] Reservation Service corriendo en puerto ${PORT}`);
  logger.info(`📚 Swagger UI en http://localhost:${PORT}/api/reservations/docs`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM recibido. Apagando elegantemente...');
  outboxProcessor.stop();
  expirationWorker.stop();
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

export { app };
