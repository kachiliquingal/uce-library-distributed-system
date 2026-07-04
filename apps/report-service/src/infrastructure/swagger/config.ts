import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UCE Library - Report Service API (MS-07)',
      version: '1.0.0',
      description: 'Analytics, Time-Series Reporting (InfluxDB) & GraphQL API for UCE Library Distributed System',
    },
    servers: [
      {
        url: 'http://localhost:4007/api/reports',
        description: 'Local Development Server',
      },
      {
        url: '/api/reports',
        description: 'API Gateway Proxy',
      },
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.ts', './src/infrastructure/http/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
