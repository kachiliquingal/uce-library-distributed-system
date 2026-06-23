import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { loanRouter } from './infrastructure/http/routes';
import { AppDataSource } from './infrastructure/mysql/data-source';
import { KafkaProducer, RabbitMQProducer } from './infrastructure/messaging/Producers';

const app = express();

app.use(cors());
app.use(express.json());

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
    console.log('Connected to MySQL via TypeORM');

    await KafkaProducer.connect();
    await RabbitMQProducer.connect();

    app.listen(PORT, () => {
      console.log(`Loan Service running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to bootstrap Loan Service', error);
    process.exit(1);
  }
}

bootstrap();
