# UCE Library — 10 Database Types (Formal Justification)

> Requirement: exactly 10 different database types with formal academic justification.
> All run as Docker containers with EBS-backed volumes for persistence.

---

## DB-01: PostgreSQL ✅ IMPLEMENTED
- **MS:** Auth service · ec2-auth (QA-A)
- **Category:** Relational RDBMS
- **Justification:** Authentication demands ACID transactions and schema enforcement.
  Foreign keys guarantee referential integrity between users and sessions. Row-level
  locking prevents race conditions on concurrent login attempts. PostgreSQL is the
  industry standard for security-sensitive relational data.

## DB-02: MongoDB ✅ IMPLEMENTED
- **MS:** Catalog service · ec2-catalog (QA-A)
- **Category:** Document store (NoSQL)
- **Justification:** Book records are heterogeneous — ISBN-10 vs ISBN-13, DOI for
  academic papers, volume count for series, multiple editions with different metadata.
  MongoDB's schema-less documents handle this variability without nullable columns.
  Its aggregation pipeline efficiently supports catalog filtering and faceted search.

## DB-03: Redis ✅ IMPLEMENTED
- **MS:** Auth service · ec2-auth (QA-A)
- **Category:** In-memory cache ← satisfies the mandatory cache requirement
- **Justification:** Sub-millisecond reads accelerate JWT validation on every protected
  request without hitting PostgreSQL. TTL-based expiration is native — ideal for session
  blacklisting. The INCR + EXPIRE pattern implements rate limiting in O(1).

## DB-04: MySQL
- **MS:** Loan service · ec2-loan (QA-A)
- **Category:** Relational RDBMS with replica support
- **Justification:** Loan transactions require strict ACID — a book cannot be borrowed
  and available simultaneously. AWS Aurora MySQL (PROD) provides automatic read/write
  replica provisioning, satisfying the spec's read-only/write-only node requirement.
  CQRS routes write commands to the primary and read queries to the replica.

## DB-05: Cassandra
- **MS:** Notification service · ec2-notification (QA-B)
- **Category:** Wide-column store (NoSQL)
- **Justification:** Notification service ingests Kafka events at high throughput.
  Cassandra's LSM-tree write path handles thousands of inserts per second without
  lock contention. Its wide-column model partitions records by user_id sorted by
  timestamp — making "last 50 notifications for user X" an O(1) partition scan.

## DB-06: Neo4j
- **MS:** User service · ec2-user (QA-A)
- **Category:** Graph database
- **Justification:** RBAC is inherently graph-shaped:
  User → has_role → Role → has_permission → Permission.
  Multi-hop traversals in relational DBs require expensive recursive CTEs.
  In Neo4j these are first-class Cypher queries with complexity proportional to
  relationships traversed, not total row count.

## DB-07: Elasticsearch
- **MS:** Fine service (index: fines) + Search service (index: books) · ec2-fine (QA-B)
- **Category:** Search engine / inverted index
- **Justification:** Full-text search using SQL LIKE is O(n). Elasticsearch's inverted
  index delivers sub-10ms relevance-ranked results across millions of records. Its
  aggregation pipeline powers fine reporting dashboards. Sharing one cluster across
  two MS via separate indices significantly reduces AWS cost.

## DB-08: InfluxDB
- **MS:** Report service · ec2-report (QA-B)
- **Category:** Time-series database
- **Justification:** Loan counts, active users, and fine revenue are time-series data —
  always queried by time range. Relational GROUP BY on datetime degrades at scale.
  InfluxDB provides native O(log n) range scans, automatic downsampling, and retention
  policies without schema tuning.

## DB-09: DynamoDB
- **MS:** Reservation service · ec2-reservation (QA-B) — AWS-managed, no EC2 storage
- **Category:** Managed key-value / document store
- **Justification:** Reservations are always looked up by composite key (room_id, date).
  DynamoDB's partition + sort key maps exactly to this pattern, giving single-digit ms
  reads at any scale. As an AWS-managed service it requires no EC2 instance. Native TTL
  auto-expires past reservations without cron jobs.

## DB-10: CouchDB
- **MS:** Inventory service · ec2-inventory (QA-B)
- **Category:** Document store with built-in master-master replication
- **Justification:** Physical inventory may be updated by barcode scanners in areas with
  unreliable connectivity (basement stacks). CouchDB's built-in replication with conflict
  resolution allows offline edits to sync when connectivity restores — a capability that
  requires complex custom code in any other database. Its HTTP-native REST API also
  simplifies integration with embedded scanning devices.

---

## EBS + Docker Compose pattern (apply to every DB instance)

```yaml
# docker-compose.yml — example for ec2-auth
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/ebs/postgres   # ← EBS mount point
  redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/ebs/redis
```

See AWS_STRATEGY.md for the Terraform EBS attachment and EC2 user_data mount script.
