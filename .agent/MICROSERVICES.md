# UCE Library — 10 Microservices Definition

> Every MS follows Hexagonal Architecture with 3 mandatory levels:
>   Domain (entities, repository interfaces — zero framework deps)
>   Application (use cases — orchestrate domain + ports)
>   Infrastructure (Express controllers, DB repos, Kafka/RabbitMQ, gRPC stubs)
>
> API Gateway and Frontend are NOT microservices and do NOT count toward the 10 required.
> Each microservice runs on its own dedicated EC2 instance.

---

## MS-01: Auth Service ✅ IMPLEMENTED
- **Account / Instance:** QA-A / ec2-auth
- **Purpose:** User registration, login, JWT issuance and validation
- **Tech:** Node.js / Express / TypeScript
- **DB:** PostgreSQL (credentials) + Redis (session cache + rate limiting)
- **Protocols:** REST
- **Endpoints:** POST /register, POST /login, GET /validate-token
- **Emits:** `user.registered` → Kafka
- **Pattern:** Hexagonal ✅

---

## MS-02: Catalog Service ✅ IMPLEMENTED
- **Account / Instance:** QA-A / ec2-catalog
- **Purpose:** Book and author inventory management (CRUD)
- **Tech:** Node.js / Express / TypeScript
- **DB:** MongoDB
- **Protocols:** REST (public) · gRPC server (consumed by inventory-service)
- **Endpoints:** GET /books · POST /books · GET /books/:id · GET /authors
- **Emits:** `book.added`, `book.updated` → Kafka
- **Pattern:** Hexagonal ✅

---

## MS-03: Loan Service ✅ IMPLEMENTED
- **Account / Instance:** QA-A / ec2-loan
- **Purpose:** Core domain — book loans and returns
- **Tech:** Node.js / Express / TypeScript
- **DB:** MySQL (write node) · Aurora read replica in PROD
- **Protocols:** REST (public) · gRPC client → user-service
- **Endpoints:** POST /loans · PUT /loans/:id/return · GET /loans/user/:userId · GET /loans/active
- **Emits:** `book.borrowed` → Kafka · `book.returned` → Kafka · `fine.trigger` → RabbitMQ
- **Consumes:** `user.registered` ← Kafka
- **Pattern:** Hexagonal + CQRS (write → MySQL primary · read → Aurora replica)

---

## MS-04: Notification Service ✅ IMPLEMENTED
- **Account / Instance:** QA-B / ec2-notification
- **Purpose:** Sends email and push notifications triggered by domain events
- **Tech:** Node.js / Express / TypeScript
- **DB:** Cassandra (notification history — high write throughput)
- **Protocols:** REST health endpoint · Kafka consumer · RabbitMQ consumer
- **Consumes:** `book.borrowed`, `book.returned`, `fine.created`, `user.registered` ← Kafka/RabbitMQ
- **Pattern:** Hexagonal (purely event-driven — no other service calls this via REST)

---

## MS-05: User Service ✅ IMPLEMENTED
- **Account / Instance:** QA-A / ec2-user
- **Purpose:** Extended user profiles · RBAC roles (student / librarian / admin)
- **Tech:** Node.js / Express / TypeScript
- **DB:** Neo4j (graph: User → has_role → Role → has_permission → Permission)
- **Protocols:** REST (public) · gRPC server (consumed by loan-service and auth-service)
- **Endpoints:** GET /users/:id · PUT /users/:id/roles · GET /users/:id/permissions
- **Emits:** `user.updated`, `user.suspended` → Kafka
- **Pattern:** Hexagonal ✅

---

## MS-06: Fine Service ✅ IMPLEMENTED
- **Account / Instance:** QA-B / ec2-fine
- **Purpose:** Calculates and tracks overdue fines for late returns
- **Tech:** Node.js / Express / TypeScript
- **DB:** Elasticsearch (fine records — fast search by user, date, status)
- **Protocols:** REST · RabbitMQ consumer
- **Consumes:** `fine.trigger` ← RabbitMQ (from loan-service)
- **Emits:** `fine.created` → Kafka (consumed by notification-service)
- **Pattern:** Hexagonal + CQRS

---

## MS-07: Report Service ❌ TODO — build 7th
- **Account / Instance:** QA-B / ec2-report
- **Purpose:** Analytics — loans per day, top books, peak hours, fine revenue
- **Tech:** Node.js / Express / TypeScript
- **DB:** InfluxDB (time-series — every domain event → metric with timestamp)
- **Protocols:** GraphQL (client-facing) · REST (health)
- **GraphQL queries:** loansPerDay · topBorrowedBooks · activeUsersCount · fineRevenueSummary
- **Consumes:** ALL domain events ← Kafka (read-only analytics consumer)
- **Pattern:** Hexagonal + CQRS (only reads, never writes to other services)

---

## MS-08: Reservation Service ❌ TODO — build 8th (independent)
- **Account / Instance:** QA-B / ec2-reservation
- **Purpose:** Real-time study room and equipment reservations
- **Tech:** Node.js / Express / TypeScript
- **DB:** DynamoDB (AWS-managed · key: room_id + date)
- **Protocols:** REST · MQTT publisher (Mosquitto)
- **Endpoints:** POST /reservations · DELETE /reservations/:id · GET /rooms/available?date=
- **MQTT topics:** `library/rooms/<room_id>/status`
- **Pattern:** Hexagonal

---

## MS-09: Inventory Service ❌ TODO — build 6th
- **Account / Instance:** QA-B / ec2-inventory
- **Purpose:** Physical book stock — shelf location and copy count per ISBN
- **Tech:** Node.js / Express / TypeScript
- **DB:** CouchDB (offline-tolerant replication for barcode scanners)
- **Protocols:** REST · gRPC client → catalog-service (validate ISBN before stock update)
- **Endpoints:** GET /inventory/:isbn · PUT /inventory/:isbn/stock · GET /inventory/low-stock
- **Pattern:** Hexagonal

---

## MS-10: Search Service ❌ TODO — build 5th
- **Account / Instance:** QA-B / ec2-search
- **Purpose:** Full-text search across books, authors, ISBN, descriptions
- **Tech:** Node.js / Express / TypeScript
- **DB:** Elasticsearch — index `books` on the cluster hosted on ec2-fine (Account B)
- **Protocols:** REST
- **Endpoints:** GET /search?q= · GET /search/suggestions?prefix=
- **Consumes:** `book.added`, `book.updated` ← Kafka (keeps ES index in sync with catalog)
- **Pattern:** Hexagonal

---

## Internal Communication Map

```
Internet
  └─► ec2-gateway (Nginx — only public entry point)
        ├─► auth-service         REST  /api/auth/
        ├─► catalog-service      REST  /api/catalog/
        ├─► loan-service         REST  /api/loan/
        ├─► user-service         REST  /api/users/
        ├─► fine-service         REST  /api/fines/
        ├─► report-service       GraphQL /api/reports/
        ├─► reservation-service  REST  /api/reservations/
        ├─► inventory-service    REST  /api/inventory/
        ├─► search-service       REST  /api/search/
        └─► frontend             static /

gRPC (internal, no HTTP overhead):
  loan-service      ──► user-service      ValidateUser(userId)
  inventory-service ──► catalog-service   ValidateISBN(isbn)

Kafka (high-throughput domain events):
  Producers:
    auth-service       user.registered
    catalog-service    book.added · book.updated
    loan-service       book.borrowed · book.returned
    fine-service       fine.created
    user-service       user.updated · user.suspended
  Consumers:
    notification-service  ← book.borrowed · book.returned · fine.created · user.registered
    report-service        ← ALL events (analytics)
    search-service        ← book.added · book.updated

RabbitMQ (async task queues):
  loan-service   → queue: fine.trigger       → fine-service
  fine-service   → queue: notifications.email → notification-service

MQTT (real-time):
  reservation-service → topic: library/rooms/+/status → frontend
```

---

## Recommended Build Order

| Week | MS | Why |
|------|----|-----|
| 1 | MS-05 user-service | loan-service gRPC client needs this server running first |
| 2 | MS-03 loan-service | Core domain — its Kafka events unblock notification, fine, report, search |
| 3 | MS-04 notification-service | Pure consumer, no dependencies |
| 4 | MS-06 fine-service | Needs loan-service RabbitMQ events |
| 5 | MS-10 search-service | Needs catalog-service Kafka events |
| 6 | MS-09 inventory-service | Needs catalog-service gRPC |
| 7 | MS-07 report-service | Needs all Kafka events live |
| 8 | MS-08 reservation-service | Independent domain |
