import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Catalog Service API",
      version: "1.0.0",
      description: "API for managing library catalog (books and authors)",
    },
    servers: [
      {
        url: "/api/catalog",
        description: "API Gateway Proxy Route",
      },
      {
        url: "http://localhost:3002/api/catalog",
        description: "Local Development Server",
      }
    ],
  },
  apis: ["./src/infrastructure/routes/bookRoutes.ts", "./dist/infrastructure/routes/bookRoutes.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
