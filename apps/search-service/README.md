# 🔍 MS-09: Search Service (Advanced Search & Caching Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![ElasticSearch](https://img.shields.io/badge/Elastic_Search-005571?style=for-the-badge&logo=elasticsearch&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

The **Search Service (MS-09)** is the high-speed indexed search engine of **UCE Library**. Built with **TypeScript, ElasticSearch, and Redis**, it delivers full-text relevancy searching, auto-completion, and faceted filtering across the entire library catalog, offloading heavy query traffic from primary transactional databases.

---

## 🏛️ Why ElasticSearch & Redis (Speed & Inverted Indexing)

Complex literary queries (by partial keywords, synonyms, or typographical errors) represent one of the most frequent and computationally expensive operations in a university library:
- Performing wildcard `LIKE '%...%'` SQL queries on relational or NoSQL databases dramatically degrades performance during peak campus hours.
- **ElasticSearch** implements highly optimized inverted indexes for full-text search with typographical fault tolerance (fuzzy matching).
- **Redis** acts as an in-memory caching layer delivering sub-millisecond access for popular queries, guaranteeing near-instantaneous response times.

---

## 🏛️ Synchronization Architecture

```
src/
├── domain/             # SearchDocument interface (ElasticSearch document structure)
├── application/        # Use Cases (SearchBooksUseCase, IndexBookUseCase, ClearCacheUseCase)
├── infrastructure/     # Technology adapters
│   ├── elastic/        # ElasticSearchClient (Connection and index management)
│   ├── redis/          # RedisCacheClient (Cache-Aside pattern implementation)
│   ├── messaging/      # KafkaConsumer (Synchronizes catalog changes)
│   └── http/           # Express routes and controllers
└── index.ts            # Server initialization
```

- **Continuous Synchronization via Kafka:** Listens to book creation or modification events emitted by `catalog-service` to automatically index or update documents in ElasticSearch in real time.

---

## 🚀 Key Features

1. **Full-Text Search & Fuzzy Matching:** Support for imprecise or partial queries by title, author, or university faculty.
2. **In-Memory Caching (Redis):** Caches frequent search results with configurable Time-To-Live (TTL), reducing network latency to <5ms.
3. **Efficient Pagination:** Returns results ordered and scored by relevancy.
4. **Swagger / OpenAPI Documentation:** Interactive testing suite available at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Headers |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/search` | Execute advanced book search in ElasticSearch / Redis | Query: `?q=...&page=1&limit=10` |
| `POST` | `/api/search/index` | Force manual re-indexing of a book (Admin only) | JSON Body: Book metadata |
| `DELETE` | `/api/search/cache` | Clear search query cache in Redis | N/A |
| `GET` | `/health` | Microservice health check endpoint for AWS ALB | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/search-service`:

```ini
PORT=3007
NODE_ENV=development
ELASTICSEARCH_NODE=http://localhost:9200
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
The service includes Jest unit tests to validate use cases and caching behavior:
```bash
npm test
```

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
