# UCE Library — Requirements Checklist

> Source: professor's specification document.
> Do not modify — the spec does not change.
> Use this as the definitive reference for what is mandatory vs optional.

---

## Architecture (mandatory)

- [ ] Minimum 10 microservices — API Gateway and Frontend do NOT count
- [ ] Every MS: minimum 3 structural levels (Domain / Application / Infrastructure)
- [ ] No file exceeds 1,000 lines of code
- [ ] Paradigms: Microservices + Event-Driven Architecture + CQRS
- [ ] Patterns: Hexagonal Architecture on all MS

## Communication Protocols (ALL mandatory — none can be skipped)

- [ ] Apache Kafka — high-throughput domain event bus
- [ ] RabbitMQ — async task queues
- [ ] MQTT — lightweight real-time messaging (reservation-service)
- [ ] REST API — standard HTTP endpoints
- [ ] gRPC — internal high-performance calls between MS
- [ ] GraphQL — flexible client queries (report-service)

## AWS Infrastructure (mandatory)

- [ ] Terraform IaC — ALL infrastructure as code, zero manual clicks
- [ ] Custom API Gateway — Nginx from scratch; AWS API Gateway is FORBIDDEN
- [ ] AWS IAM advanced features — FORBIDDEN (student account limitation)
- [ ] Custom Nginx load balancers in PROD — FORBIDDEN; use AWS ELB
- [ ] ELB + ASG — PROD only, not QA
- [ ] Multi-AZ — PROD spans at least 2 Availability Zones
- [ ] QA ↔ PROD network isolation — zero communication between environments
- [ ] EC2 Bastion Host — SSH jump access to private instances
- [ ] S3 — Terraform remote state backend ✅

## Databases (mandatory)

- [ ] Exactly 10 different database types
- [ ] At least 1 dedicated cache layer — Redis ✅
- [ ] Read/write replicas — Aurora MySQL for loan-service in PROD
- [ ] Service queue synchronizing write node → read replicas
- [ ] All databases contain sample/mock data — empty DBs not accepted
- [ ] EBS volumes for Docker persistence — data survives EC2 restarts
- [ ] n8n for QA → PROD schema/data migration automation

## Security (mandatory)

- [ ] Dedicated Auth microservice ✅
- [ ] JWT tokens on all protected routes
- [ ] CORS on API Gateway
- [ ] Cloudflare Firewall + Rate Limiting
- [ ] EC2 Bastion Host

## DevOps / CI/CD (mandatory)

- [ ] Monorepo (Turborepo) ✅
- [ ] All branches, commits, PRs, and code comments in English
- [ ] Conventional Commits standard
- [ ] Docker + Docker Hub ✅
- [ ] GitHub Actions CI/CD ✅
- [ ] Unit Testing integrated in CI
- [ ] Functional Testing — all endpoints via Postman
- [ ] Load Testing integrated in CD (k6 or Artillery)
- [ ] Backups — connect to on-premise server

## Monitoring (mandatory — every MS from first commit)

- [ ] Site24x7 — uptime monitoring per instance
- [ ] Prometheus — prom-client in every MS, /metrics endpoint
- [ ] Grafana — dashboards per MS

## Project Management (mandatory)

- [ ] GitHub Projects — tasks as weekly cards (no cards = 0 grade)
- [ ] One MS per week delivered via Pull Request
- [ ] PR deployed in QA + PROD for every evaluation
- [ ] Swagger docs for every MS
- [ ] README.md in English for every MS

---

## Optional features (bonus points)

- Kubernetes on-premise Hello World
- Microfrontends (≥ 3)
- Multi-region PROD
- Multi-VPC architecture
- Automated DB backups
- AI agent for data analysis
- Blockchain integration
- Payment gateway (Stripe / Payla)
- Active Directory authentication
- Go language for parallel tasks
