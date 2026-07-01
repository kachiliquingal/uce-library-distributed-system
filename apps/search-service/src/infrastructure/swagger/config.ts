import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UCE Library - Search Service API',
      version: '1.0.0',
      description: 'API documentation for the Search Service of UCE Library Distributed System. This service provides full-text search capabilities using Elasticsearch and CQRS patterns.',
      contact: {
        name: 'API Support',
        email: 'support@uce.edu.ec'
      }
    },
    servers: [
      {
        url: '/api/search',
        description: 'API Gateway Proxy Route (Production/QA)'
      },
      {
        url: 'http://localhost:3007/api/search',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/infrastructure/http/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
