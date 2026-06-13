import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "API for managing users and roles using Neo4j.",
    },
    servers: [
      {
        url: "http://localhost:3003/api",
        description: "Local server",
      },
    ],
  },
  apis: ["./src/infrastructure/http/routes.ts", "./src/infrastructure/http/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
