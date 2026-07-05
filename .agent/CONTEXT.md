# UCE Library — Project Context (Living Document)

> Update this file at the end of every sprint.
> This is the single source of truth for any AI agent or team member.
> If you are an AI agent: trust this file over your own assumptions.

---

## Current Status

| Item | Status |
|------|--------|
| QA environment | ✅ Stable and automated |
| PROD environment | 🔄 In progress — ELB + ASG pending |
| Microservices completed | 9 / 10 |
| Databases implemented | 9 / 10 |
| Message brokers | ✅ Implemented — Kafka, RabbitMQ |
| Monitoring | ✅ Implemented — Prometheus, Grafana |
| CI/CD pipelines | ✅ ci.yml · cd-apps.yml · deploy-infra.yml |
| Swagger docs | ✅ Implemented on completed MS |
| Load testing | ❌ Pending |

---

## AWS Account Architecture

> CRITICAL — read carefully before suggesting any infrastructure change.
>
> There are 9 AWS Academy accounts total.
> The architecture uses 4 accounts actively (2 per environment).
> Each account has a hard limit of 9 EC2 instances.
> The remaining 5 accounts are reserve — do not use unless explicitly decided.
>
> Rule: 1 microservice per EC2 instance. No sharing. This ensures fault isolation,
> independent scaling via ASG, and clean logs and metrics per service.

### QA Environment — 2 accounts

#### QA Account A — Core microservices
| Instance | Name | Service | DB on same instance |
|----------|------|---------|-------------------|
| 1 | ec2-auth | auth-service (MS-01) | PostgreSQL + Redis |
| 2 | ec2-catalog | catalog-service (MS-02) | MongoDB |
| 3 | ec2-loan | loan-service (MS-03) | MySQL |
| 4 | ec2-user | user-service (MS-05) | Neo4j |
| 5 | ec2-gateway | API Gateway (Nginx) | — |
| 6 | ec2-frontend | Frontend (React/Vite) | — |
| 7 | ec2-infra | Kafka + RabbitMQ + MQTT + n8n | — |
| 8 | ec2-monitoring | Prometheus + Grafana | — |
| 9 | *(reserve)* | — | — |

#### QA Account B — Secondary microservices
| Instance | Name | Service | DB on same instance |
|----------|------|---------|-------------------|
| 1 | ec2-fine | fine-service (MS-06) | Elasticsearch |
| 2 | ec2-report | report-service (MS-07) | InfluxDB |
| 3 | ec2-notification | notification-service (MS-04) | Cassandra |
| 4 | ec2-reservation | reservation-service (MS-08) | — (DynamoDB is AWS-managed) |
| 5 | ec2-search | search-service (MS-10) | — (ES on ec2-fine) |
| 6 | ec2-inventory | inventory-service (MS-09) | CouchDB |
| 7–9 | *(reserve)* | — | — |

### PROD Environment — 2 accounts (mirror of QA + ELB + ASG)

PROD Account A and PROD Account B mirror the QA layout exactly,
with these additions in PROD only:
- Application Load Balancer (ELB) routing traffic to Auto Scaling Groups
- ASG: min=1, max=3 per service group
- Multi-AZ: instances span at least us-east-1a and us-east-1b
- AWS Aurora MySQL (read + write replicas) replacing standalone MySQL for loan-service

### Reserve accounts (5 remaining)
| Account | Planned use if needed |
|---------|----------------------|
| 5 | Kubernetes Hello World (optional bonus) |
| 6 | Site24x7 agent hosts |
| 7 | On-premise backup simulation |
| 8 | Multi-region PROD experiment (optional bonus) |
| 9 | Emergency reserve |

### S3 buckets (already configured ✅)
- `uce-library-tfstate-qa-a` — Terraform state for QA Account A
- `uce-library-tfstate-qa-b` — Terraform state for QA Account B
- `uce-library-tfstate-prod-a` — Terraform state for PROD Account A
- `uce-library-tfstate-prod-b` — Terraform state for PROD Account B

---

## Repository Structure

```
uce-library/                         ← monorepo root (Turborepo)
├── .agent/                          ← AI context folder (YOU ARE HERE)
│   ├── AGENT_README.md              ← What this folder is and how to use it
│   ├── CONTEXT.md                   ← This file — update after every sprint
│   ├── REQUIREMENTS.md              ← Full professor spec as checklist
│   ├── MICROSERVICES.md             ← All 10 MS defined
│   ├── DATABASES.md                 ← All 10 DBs with formal justification
│   ├── AWS_STRATEGY.md              ← Account layout and infrastructure rules
│   ├── CONVENTIONS.md               ← Commits, code structure, templates
│   └── TASKS.md                     ← GitHub Projects task cards
├── apps/
│   ├── auth-service/                ✅ MS-01
│   ├── catalog-service/             ✅ MS-02
│   ├── loan-service/                ✅ MS-03
│   ├── notification-service/        ✅ MS-04
│   ├── user-service/                ✅ MS-05
│   ├── fine-service/                ✅ MS-06
│   ├── report-service/              ✅ MS-07
│   ├── reservation-service/         ❌ MS-08 — TODO
│   ├── inventory-service/           ✅ MS-09
│   ├── search-service/              ✅ MS-10
│   ├── api-gateway/                 ✅ Nginx — NOT a microservice
│   └── frontend/                    ✅ React 18 + Vite — NOT a microservice
├── infrastructure/
│   ├── qa-a/                        ✅ Terraform — QA Account A
│   ├── qa-b/                        ❌ Terraform — QA Account B (TODO)
│   ├── prod-a/                      🔄 Terraform — PROD Account A (ELB+ASG pending)
│   └── prod-b/                      ❌ Terraform — PROD Account B (TODO)
├── packages/
│   └── shared/                      ← Shared TypeScript types
├── turbo.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, TypeScript, Express.js |
| Frontend | React 18, Vite, Tailwind CSS 4, Zustand |
| Architecture | Hexagonal Architecture on every MS |
| Patterns | CQRS on Loan, Fine, Report services |
| IaC | Terraform (HCL) |
| CI/CD | GitHub Actions + Turborepo |
| Containers | Docker + Docker Hub |
| Auto-deploy | Watchtower (polls Docker Hub every 60s) |
| Monorepo | Turborepo |

---

## Microservices Build Order (follow this sequence)

1. ✅ MS-05 user-service — loan-service needs its gRPC server first
2. ❌ MS-03 loan-service — core domain, unlocks Kafka events for everyone else
3. ❌ MS-04 notification-service — pure consumer, no blockers
4. ❌ MS-06 fine-service — needs loan-service RabbitMQ events
5. ❌ MS-10 search-service — needs catalog-service Kafka events
6. ❌ MS-09 inventory-service — needs catalog-service gRPC
7. ❌ MS-07 report-service — needs all Kafka events live
8. ❌ MS-08 reservation-service — independent, build any time

---

## Weekly Delivery Checklist (per microservice PR)

- [ ] Hexagonal Architecture: Domain / Application / Infrastructure layers present
- [ ] Deployed and functional in QA
- [ ] Deployed and functional in PROD
- [ ] Swagger UI at `/api/<service>/docs`
- [ ] README.md in English
- [ ] Unit tests passing (`turbo test`)
- [ ] Prometheus `/metrics` endpoint responding
- [ ] Postman collection committed to `tests/postman/`
- [ ] Docker image on Docker Hub with correct tag
- [ ] All commits follow Conventional Commits
- [ ] No file exceeds 1,000 lines
