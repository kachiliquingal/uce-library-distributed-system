import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Service API',
      version: '1.0.0',
      description: 'API for physical book stock management',
    },
    servers: [
      {
        url: '/api/inventory',
        description: 'API Gateway proxy path',
      },
      {
        url: 'http://localhost:4009/api/inventory',
        description: 'Local development',
      }
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
