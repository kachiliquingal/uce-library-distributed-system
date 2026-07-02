import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fine Service API',
      version: '1.0.0',
      description: 'API documentation for the UCE Library Fine Service',
    },
    servers: [
      {
        url: '/api/fines',
        description: 'API Gateway Proxy Route',
      },
      {
        url: 'http://localhost:3006/api/fines',
        description: 'Local development server',
      }
    ],
  },
  apis: ['./src/infrastructure/http/*.ts', './dist/infrastructure/http/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
