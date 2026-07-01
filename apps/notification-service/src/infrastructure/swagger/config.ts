import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'API documentation for Notification Service',
    },
    servers: [
      {
        url: '/api/notifications',
        description: 'API Gateway Proxy Route',
      },
      {
        url: 'http://localhost:3005/api/notifications',
        description: 'Local Development Server',
      }
    ],
  },
  apis: ['./src/infrastructure/http/*.ts', './dist/infrastructure/http/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
