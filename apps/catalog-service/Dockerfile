# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN mkdir -p dist/infrastructure/grpc && cp src/infrastructure/grpc/*.proto dist/infrastructure/grpc/ || true

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3002
CMD ["node", "dist/index.js"]