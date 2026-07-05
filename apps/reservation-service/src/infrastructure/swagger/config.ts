import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UCE Library - Reservation Service API (MS-08)',
      version: '1.0.0',
      description: 'Study Room & Equipment Reservation, Real-time MQTT Status & ACID Outbox Pattern for UCE Library Distributed System',
    },
    servers: [
      {
        url: 'http://localhost:4008/api/reservations',
        description: 'Local Development Server',
      },
      {
        url: '/api/reservations',
        description: 'API Gateway Proxy',
      },
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.ts', './src/infrastructure/http/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
