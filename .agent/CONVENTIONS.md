# UCE Library — Development Conventions

> If you are an AI agent: follow every rule here when generating code for this project.

---

## Branch strategy

```
main        ← PROD only. Merge from qa via reviewed PR.
qa          ← QA. Merge from feature/* via PR.
feature/*   ← New MS or features.
fix/*       ← Bug fixes.
chore/*     ← Infra, CI/CD, docs updates.
```

---

## Conventional Commits (MANDATORY — professor checks this)

```
<type>(<scope>): <short description, English, present tense, lowercase>
```

| Type | Use for |
|------|---------|
| feat | New feature or new microservice |
| fix | Bug fix |
| chore | Maintenance — deps, configs, infra |
| docs | Documentation only |
| test | Adding or updating tests |
| ci | GitHub Actions changes |
| refactor | Restructuring without behaviour change |
| perf | Performance improvement |

Good examples:
```
feat(user-service): implement ValidateUser gRPC endpoint
feat(loan-service): add borrow book use case with Kafka event emission
fix(auth-service): correct JWT expiration not set on refresh token
chore(infra-qa-a): add EBS volume Terraform resource for ec2-loan
docs(catalog-service): add Swagger annotations to book endpoints
test(loan-service): add unit tests for ReturnBook use case
ci(github-actions): add k6 load test stage to cd-apps workflow
```

Bad examples — never do these:
```
updated stuff          ← vague, no type
Fix bug                ← capital, no scope
feat: many changes     ← no scope, too broad
arreglé el error       ← not in English
WIP                    ← uninformative
```

---

## Hexagonal Architecture — mandatory folder structure

```
apps/<service-name>/
├── src/
│   ├── domain/
│   │   ├── entities/              ← Pure business objects. Zero framework deps.
│   │   ├── repositories/          ← Interfaces (ports) only — no implementations.
│   │   └── value-objects/         ← Immutable domain primitives.
│   ├── application/
│   │   └── use-cases/             ← One file per use case.
│   │       ├── BorrowBook.ts
│   │       └── ReturnBook.ts
│   └── infrastructure/
│       ├── http/
│       │   ├── controllers/       ← Express handlers. No business logic here.
│       │   ├── routes/            ← Express routers with Swagger JSDoc.
│       │   ├── swagger.ts         ← Swagger/OpenAPI setup.
│       │   └── metrics.ts         ← Prometheus metrics setup.
│       ├── persistence/
│       │   └── repositories/      ← Concrete DB implementations.
│       ├── messaging/
│       │   ├── producers/         ← Kafka / RabbitMQ publish.
│       │   └── consumers/         ← Kafka / RabbitMQ subscribe.
│       └── grpc/                  ← gRPC stubs (only in MS that use gRPC).
├── tests/
│   ├── unit/                      ← Domain + use-case tests. No real DB. Mock repos.
│   └── integration/               ← Controller tests with real or in-memory DB.
├── Dockerfile
├── docker-compose.yml             ← Local dev with DB containers.
├── .env.example                   ← All env vars with example values.
└── README.md
```

---

## File size rule

No file may exceed 1,000 lines. Hard requirement from the spec.
If a file approaches the limit: split use cases into separate files,
move helpers to `utils/`, move types to `domain/types/`.

---

## Prometheus — add from the very first commit

```typescript
// src/infrastructure/http/metrics.ts
import client from 'prom-client';

client.collectDefaultMetrics({ prefix: 'uce_loan_' });

export const httpRequestDuration = new client.Histogram({
  name: 'uce_loan_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// In app.ts:
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

---

## Swagger — required in every MS

```typescript
// src/infrastructure/http/swagger.ts
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'Loan Service API', version: '1.0.0' },
    servers: [{ url: '/api/loan' }],
  },
  apis: ['./src/infrastructure/http/routes/*.ts'],
});
export { swaggerUi };

// In app.ts:
app.use('/api/loan/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## Docker image tags

```
<dockerhub-user>/uce-<service>:1.0.0-qa    ← triggered on merge to qa
<dockerhub-user>/uce-<service>:1.0.0-prod  ← triggered on merge to main
```

---

## README.md template (copy for every new MS)

```markdown
# <Service Name>

> One-line description.

## Responsibilities
- What this service owns
- What it does NOT own

## Tech Stack
- Runtime: Node.js 20 / TypeScript
- Framework: Express.js
- Database: <name> — <one-line reason>
- Protocols: REST | gRPC server | gRPC client | Kafka producer | Kafka consumer | RabbitMQ | MQTT

## Architecture
Hexagonal — Domain / Application / Infrastructure

## Running locally
\`\`\`bash
docker-compose up -d
npm install
npm run dev
\`\`\`

## Environment variables
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | Connection string | mysql://user:pass@localhost/loans |
| JWT_SECRET | Shared auth secret | supersecret |
| KAFKA_BROKER | Bootstrap server | localhost:9092 |

## API docs
Swagger UI: http://localhost:<port>/api/<service>/docs

## Events
| Direction | Broker | Topic |
|-----------|--------|-------|
| Emits | Kafka | book.borrowed |
| Consumes | RabbitMQ | fine.trigger |

## Tests
\`\`\`bash
npm test
npm run test:coverage
\`\`\`
```
