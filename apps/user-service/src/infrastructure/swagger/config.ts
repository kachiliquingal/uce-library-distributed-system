import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "API for managing users and roles via Neo4j",
    },
    servers: [
      {
        url: "/api/users",
        description: "API Gateway Proxy Route",
      },
      {
        url: "http://localhost:3003/api/users",
        description: "Local Development Server",
      }
    ],
  },
  apis: ["./src/infrastructure/http/routes.ts", "./dist/infrastructure/http/routes.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
