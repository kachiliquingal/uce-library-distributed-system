FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
RUN mkdir -p dist/infrastructure/grpc && cp src/infrastructure/grpc/*.proto dist/infrastructure/grpc/ || true

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

CMD ["node", "dist/index.js"]
