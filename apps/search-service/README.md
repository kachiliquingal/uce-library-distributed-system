# Search Service (MS-10)

Search Service for the UCE Library Distributed System.

## 📝 Overview
This microservice provides high-performance full-text search capabilities using Elasticsearch. It maintains its index synchronized by listening to Kafka events (`book.added`, `book.updated`) emitted by the `catalog-service`.

## 🏗️ Architecture
- **Layered Architecture:** Domain, Application, Infrastructure.
- **Messaging:** Kafka (Consumer).
- **Database:** Elasticsearch.
- **REST API:** Express.js with Swagger documentation.
- **Metrics:** Prometheus.

## 🚀 Getting Started
```bash
npm install
npm run dev
```

## 🔌 Endpoints
- `GET /api/search?q=<query>`: Search books.
- `GET /api/search/suggestions?prefix=<text>`: Get autocomplete suggestions.
- `GET /api/search/api-docs`: Swagger documentation.
- `GET /api/search/metrics`: Prometheus metrics.
- `GET /api/search/health`: Health check.

## 🐳 Docker
```bash
docker build -t kachiliquingal/uce-search-service .
```
