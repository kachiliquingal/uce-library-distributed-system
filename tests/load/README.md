# Grafana k6 Load & Stress Testing Suite

This directory contains the automated performance, load, and stress testing scripts for the **UCE Library Distributed System**, powered by [Grafana k6](https://k6.io/).

## Overview

The load testing suite is designed to evaluate system performance, scalability, and resilience under simulated high-concurrency traffic. It defines Quality Gates and Service Level Agreements (SLAs) that must be met before deploying to staging or production environments.

### Load Profile & Stages

The script (`k6-load-test.js`) simulates traffic across 5 distinct phases:
1. **Warmup (10s):** Ramps up virtual users (VUs) from 0 to 10 to warm up JVM/Node.js event loops, database connection pools, and Redis caches.
2. **Steady State (30s):** Maintains 50 concurrent VUs representing standard operational load.
3. **Spike / Stress (15s):** Surges to 100 concurrent VUs to simulate peak academic hours (e.g., end-of-semester book returns and exam prep).
4. **Recovery (20s):** Ramps down to 50 VUs to verify system recovery and memory stability after traffic spikes.
5. **Ramp Down (10s):** Gracefully scales down to 0 VUs.

---

## Quality Gates & SLAs

The test enforces strict thresholds. If any threshold is breached, k6 exits with a non-zero status code, failing the CI/CD pipeline:
* **System-wide p95 Latency:** `< 500ms` (95% of all requests must complete in under 500 milliseconds).
* **System-wide p99 Latency:** `< 1000ms` (99% of requests must complete in under 1 second).
* **Error Rate:** `< 5%` (HTTP 5xx or unhandled timeouts must remain below 0.05).
* **Auth Service p95:** `< 400ms`.
* **Catalog Service p95:** `< 350ms`.
* **Fine Service p95:** `< 450ms`.

---

## Running the Tests

### Option 1: Using Local k6 CLI
If you have [k6 installed locally](https://grafana.com/docs/k6/latest/get-started/installation/):
```bash
k6 run tests/load/k6-load-test.js
```

### Option 2: Using Docker (Recommended)
You can run the tests without installing k6 locally using the official Docker image:
```bash
docker run --rm -i -v "${PWD}/tests/load:/scripts" --network host grafana/k6 run /scripts/k6-load-test.js
```

### Customizing Target Environment URLs
You can override the target service endpoints using environment variables:
```bash
k6 run \
  -e BASE_URL_AUTH=http://api.library.edu/auth \
  -e BASE_URL_CATALOG=http://api.library.edu/catalog \
  -e BASE_URL_FINE=http://api.library.edu/fines \
  tests/load/k6-load-test.js
```

---

## CI/CD Integration

This load test is designed to run automatically during nightly builds or post-deployment verification stages in GitHub Actions and Jenkins pipelines. See `.github/workflows/ci.yml` for automated execution details.
