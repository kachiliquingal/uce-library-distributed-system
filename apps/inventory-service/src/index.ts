import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/swagger/config';
import { inventoryRouter, manageStockUseCase } from './infrastructure/http/routes';
import { logger } from './utils/logger';
import { KafkaConsumer } from './infrastructure/messaging/KafkaConsumer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4009;

app.use(cors());
app.use(express.json());

app.use('/api/inventory', inventoryRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'inventory-service' });
});

const kafkaConsumer = new KafkaConsumer(manageStockUseCase);

app.listen(PORT, async () => {
  logger.info(`[Inventory Service] Running on port ${PORT}`);
  await kafkaConsumer.start();
});

