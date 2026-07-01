import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fineRouter } from './infrastructure/http/routes';
import { RabbitMQConsumer } from './infrastructure/messaging/RabbitMQConsumer';
import { KafkaProducer } from './infrastructure/messaging/KafkaProducer';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4006;

app.use(cors());
// Note: Webhook route handles its own express.json(), so we put it before global json() if needed, 
// but in this setup, the fineRouter handles it all.
app.use(express.json());

app.use('/api/fines', fineRouter);

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/swagger/config';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'fine-service' });
});

app.listen(PORT, async () => {
  logger.info(`[Fine Service] Running on port ${PORT}`);
  await KafkaProducer.connect();
  await RabbitMQConsumer.connect();
});
