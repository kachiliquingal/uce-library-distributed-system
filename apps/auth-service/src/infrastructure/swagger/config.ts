import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "API for user authentication and authorization",
    },
    servers: [
      {
        url: "/api/auth",
        description: "API Gateway Proxy Route",
      },
      {
        url: "http://localhost:3001/api/auth",
        description: "Local Development Server",
      }
    ],
  },
  apis: ["./src/infrastructure/http/routes.ts", "./dist/infrastructure/http/routes.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
