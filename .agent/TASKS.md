# UCE Library — GitHub Projects Tasks

> Copy each block below as a card in GitHub Projects.
> Columns: Backlog | In Progress | In Review | Done
> Deliver one microservice per week via Pull Request — professor checks weekly.

---

## COLUMN: Infrastructure

### [INFRA-01] Provision QA Account B Terraform workspace
Create `infrastructure/qa-b/` workspace. VPC CIDR 10.1.0.0/16. Private subnet for
all secondary MS instances. VPC peering with QA Account A so the Nginx gateway can
route traffic to MS in Account B. S3 backend: `uce-library-tfstate-qa-b`.

### [INFRA-02] Provision ec2-infra — Kafka + RabbitMQ + MQTT + n8n
Instance: t2.small in QA Account A. Docker Compose with Apache Kafka + Zookeeper,
RabbitMQ (management UI), Mosquitto (MQTT broker), and n8n.
Security group: allow ports 9092 (Kafka), 5672 (RabbitMQ), 1883 (MQTT), 5678 (n8n)
from all internal instances only. This is the dependency that unblocks all event-driven MS.

### [INFRA-03] Configure Kafka topics
Create topics: user.registered · book.added · book.updated · book.borrowed ·
book.returned · fine.created · user.updated · user.suspended.
Set retention: 7 days. Partitions: 3. Replication factor: 1 (QA), 2 (PROD).

### [INFRA-04] Configure RabbitMQ queues
Create queues: fine.trigger · notifications.email.
Configure dead-letter exchanges for failed message handling.
Document exchange types and routing keys.

### [INFRA-05] Provision ec2-monitoring — Prometheus + Grafana
Instance: t2.small in QA Account A. Docker Compose with Prometheus and Grafana.
Configure prometheus.yml to scrape /metrics from all 10 MS instances.
Create one Grafana dashboard per MS: request rate, error rate, p95 latency.
Create one overview dashboard showing all services at a glance.

### [INFRA-06] Provision ec2-loan (QA Account A)
t2.small instance. Docker Compose: loan-service + MySQL container.
EBS volume for MySQL persistence at /mnt/ebs/mysql. Watchtower configured.
Terraform resource in infrastructure/qa-a/.

### [INFRA-07] Provision ec2-user (QA Account A)
t2.small instance. Docker Compose: user-service + Neo4j container.
EBS volume for Neo4j at /mnt/ebs/neo4j. Watchtower configured.

### [INFRA-08] Provision ec2-fine (QA Account B)
t2.medium instance — Elasticsearch requires ≥1 GB heap, do not use t2.micro.
Docker Compose: fine-service + Elasticsearch container.
EBS volume at /mnt/ebs/elasticsearch. Watchtower configured.

### [INFRA-09] Provision ec2-report (QA Account B)
t2.small. Docker Compose: report-service + InfluxDB. EBS at /mnt/ebs/influxdb.

### [INFRA-10] Provision ec2-notification (QA Account B)
t2.small. Docker Compose: notification-service + Cassandra. EBS at /mnt/ebs/cassandra.

### [INFRA-11] Provision ec2-reservation (QA Account B)
t2.micro. Docker Compose: reservation-service only (DynamoDB is AWS-managed).
Create DynamoDB table: Reservations. Partition key: room_id (String).
Sort key: date (String). TTL attribute: expires_at.

### [INFRA-12] Provision ec2-search (QA Account B)
t2.micro. Docker Compose: search-service. Connects to Elasticsearch on ec2-fine
via internal IP. No local DB. Watchtower configured.

### [INFRA-13] Provision ec2-inventory (QA Account B)
t2.micro. Docker Compose: inventory-service + CouchDB. EBS at /mnt/ebs/couchdb.

### [INFRA-14] Configure EC2 Bastion Host
Small t2.micro instance in public subnet of QA Account A. Security group: allow
port 22 from your IP only. All private instances allow 22 from bastion SG only.
Document the SSH jump command in AWS_STRATEGY.md.

### [INFRA-15] Deploy ELB + ASG in PROD environment (PROD only)
Application Load Balancer in PROD Account A. Multi-AZ: us-east-1a + us-east-1b.
Auto Scaling Group: min=1, max=3 per service. Terraform in infrastructure/prod-a/.
Do NOT create ELB in QA.

### [INFRA-16] Configure AWS Aurora MySQL for loan-service (PROD only)
Replace standalone MySQL in PROD with Aurora MySQL cluster.
Writer endpoint → loan-service write commands.
Reader endpoint → loan-service read queries (CQRS pattern).

### [INFRA-17] Configure Cloudflare Firewall and Rate Limiting
Add Cloudflare in front of the API Gateway Elastic IP.
Firewall rules blocking common attack patterns.
Rate limiting: 100 req/min per IP. Document in AWS_STRATEGY.md.

### [INFRA-18] Configure n8n workflow for QA → PROD data migration
Create n8n workflow that exports DB schemas and seed data from QA and imports
to PROD. Trigger: manual. Document workflow steps in a README under scripts/n8n/.

---

## COLUMN: Microservices

### [MS-05] Build user-service — Week 1
BUILD FIRST — loan-service gRPC client depends on this server.
Hexagonal Architecture. Neo4j. gRPC server with protobuf: ValidateUser, GetPermissions.
REST: GET /users/:id · PUT /users/:id/roles · GET /users/:id/permissions.
Kafka producer: user.updated · user.suspended.
Swagger at /api/users/docs. Unit tests (Jest). Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-03] Build loan-service — Week 2
Hexagonal + CQRS. MySQL primary + Aurora read replica (PROD).
REST: POST /loans · PUT /loans/:id/return · GET /loans/user/:userId · GET /loans/active.
gRPC client calling user-service.
Kafka producer: book.borrowed · book.returned.
RabbitMQ producer: fine.trigger.
Kafka consumer: user.registered.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-04] Build notification-service — Week 3
Hexagonal. Cassandra.
Kafka consumer: book.borrowed · book.returned · fine.created · user.registered.
RabbitMQ consumer: notifications.email.
REST health endpoint only. No other service calls this via REST.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-06] Build fine-service — Week 4
Hexagonal + CQRS. Elasticsearch (index: fines).
RabbitMQ consumer: fine.trigger.
Kafka producer: fine.created.
REST: GET /fines · GET /fines/user/:userId · PUT /fines/:id/pay.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-10] Build search-service — Week 5
Hexagonal. Elasticsearch index `books` on ec2-fine cluster.
Kafka consumer: book.added · book.updated (keeps index in sync with catalog).
REST: GET /search?q= · GET /search/suggestions?prefix=.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-09] Build inventory-service — Week 6
Hexagonal. CouchDB.
gRPC client → catalog-service ValidateISBN.
REST: GET /inventory/:isbn · PUT /inventory/:isbn/stock · GET /inventory/low-stock.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-07] Build report-service — Week 7
Hexagonal + CQRS (read-only analytics consumer).
InfluxDB time-series.
Kafka consumer: ALL domain events → write metrics with timestamp.
GraphQL API: loansPerDay · topBorrowedBooks · activeUsersCount · fineRevenueSummary.
REST health endpoint.
Swagger for REST. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

### [MS-08] Build reservation-service — Week 8 ✅ DONE
Hexagonal. DynamoDB (AWS-managed).
MQTT publisher: library/rooms/<room_id>/status.
REST: POST /reservations · DELETE /reservations/:id · GET /rooms/available?date=.
Swagger. Unit tests. Prometheus /metrics. README.
PR deployed in QA + PROD.

---

## COLUMN: Databases

### [DB-01] Write seed scripts for all databases
No database may be empty for evaluation. Minimum data:
- 50 books with full metadata (catalog / MongoDB)
- 20 users with roles (auth / PostgreSQL + user / Neo4j)
- 30 loan records — mix of active and returned (loan / MySQL)
- 15 fine records — mix of pending and paid (fine / Elasticsearch)
- 30 notification records (notification / Cassandra)
- 15 reservation records (reservation / DynamoDB)
- Full inventory records matching all 50 book ISBNs (inventory / CouchDB)
- Pre-populated Elasticsearch book index (search)
- Pre-populated InfluxDB metrics (report)
Commit seed scripts under `scripts/seed/<service>/seed.ts`.

### [DB-02] Verify and document all 10 DB formal justifications
Ensure DATABASES.md is complete. This document may be shown to the professor
during the architecture review. Each justification must explain: what the DB stores,
why this DB type was chosen over alternatives, and why it fits this specific use case.

---

## COLUMN: Testing

### [TEST-01] Add unit tests to auth-service and catalog-service
Write tests for all domain entities and use cases. Mock all repo interfaces.
Target: ≥70% coverage. Run via `turbo test` in CI pipeline.

### [TEST-02] Create Postman collections for all MS
One collection per MS. Cover: happy path, validation errors, auth errors, edge cases.
Export and commit under `tests/postman/<service>.collection.json`.

### [TEST-03] Add k6 load testing to CD pipeline
Write k6 scripts hitting main endpoints of each MS under load.
Integrate into cd-apps.yml after Docker build stage.
Thresholds: p95 latency < 500ms, error rate < 1%.

### [TEST-04] Add integration tests for API Gateway routing
Automated tests verifying all routes through Nginx reach the correct MS.
Run as part of CD pipeline post-deploy smoke test.

---

## COLUMN: Observability

### [OBS-01] Add prom-client to auth-service and catalog-service
Install prom-client. Add collectDefaultMetrics. Add httpRequestDuration histogram.
Expose GET /metrics. Verify Prometheus scrapes it successfully.

### [OBS-02] Register all EC2 instances in Site24x7
Install Site24x7 agent on every instance. Configure uptime monitors for each
service health endpoint. Set alert policies for downtime notification.

---

## COLUMN: Documentation

### [DOC-01] Add Swagger to auth-service and catalog-service
swagger-jsdoc + swagger-ui-express. JSDoc annotations on all route files.
Swagger UI at /api/auth/docs and /api/catalog/docs.

### [DOC-02] Write README.md for auth-service and catalog-service
Use the template in CONVENTIONS.md. Cover: purpose, stack, architecture,
local setup, env vars, API docs URL, events, test commands.

### [DOC-03] Update .agent/CONTEXT.md after every sprint
Mark completed MS as ✅. Update DB count. Note infra changes.
This keeps AI context accurate for the next development session.
