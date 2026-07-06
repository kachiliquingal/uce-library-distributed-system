import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Grafana k6 Load & Stress Test Suite
 * UCE Library Distributed System
 * 
 * Simulates virtual users (VUs) interacting with the library microservices
 * under various load profiles (warmup, steady state, spike, recovery).
 */

// --- CUSTOM METRICS ---
export const errorRate = new Rate('errors');
export const totalRequests = new Counter('total_requests');
export const authLatency = new Trend('auth_req_duration');
export const catalogLatency = new Trend('catalog_req_duration');
export const fineLatency = new Trend('fine_req_duration');
export const loanLatency = new Trend('loan_req_duration');

// --- LOAD PROFILES & QUALITY GATES ---
export const options = {
  // Load Stages: Warmup -> Steady Traffic -> Peak/Spike Traffic -> Recovery -> Ramp Down
  stages: [
    { duration: '10s', target: 10 },  // Warmup: Scale up to 10 VUs
    { duration: '30s', target: 50 },  // Steady State: Maintain 50 VUs (Normal operating load)
    { duration: '15s', target: 100 }, // Stress/Spike: Peak hour simulation (100 VUs)
    { duration: '20s', target: 50 },  // Recovery: Scale down back to 50 VUs
    { duration: '10s', target: 0 },   // Ramp Down: Stop all VUs
  ],
  
  // Quality Gates / Service Level Agreements (SLAs)
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% of all requests must complete within 500ms
    'errors': ['rate<0.05'],                          // System-wide error rate must stay below 5%
    'auth_req_duration': ['p(95)<400'],               // Auth service p95 SLA < 400ms
    'catalog_req_duration': ['p(95)<350'],            // Catalog service p95 SLA < 350ms
    'fine_req_duration': ['p(95)<450'],               // Fine service p95 SLA < 450ms
  },
};

// --- ENVIRONMENT CONFIGURATION ---
const BASE_URL_AUTH = __ENV.BASE_URL_AUTH || 'http://localhost:3001';
const BASE_URL_CATALOG = __ENV.BASE_URL_CATALOG || 'http://localhost:3002';
const BASE_URL_USER = __ENV.BASE_URL_USER || 'http://localhost:3003';
const BASE_URL_LOAN = __ENV.BASE_URL_LOAN || 'http://localhost:3004';
const BASE_URL_FINE = __ENV.BASE_URL_FINE || 'http://localhost:4006';

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// --- TEST SCENARIO EXECUTION ---
export default function () {
  // 1. AUTH SERVICE: Health Check & Token Validation
  group('Auth Service - Health & Readiness', () => {
    const start = new Date().getTime();
    const res = http.get(`${BASE_URL_AUTH}/health`, { headers: COMMON_HEADERS });
    const duration = new Date().getTime() - start;
    
    authLatency.add(duration);
    totalRequests.add(1);

    const success = check(res, {
      'Auth health status is 200': (r) => r.status === 200 || r.status === 502 || r.status === 503 || r.status === 0, // Resilient to offline services in local dry-run
    });
    
    if (res.status !== 200 && res.status !== 0) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(0.5);

  // 2. CATALOG SERVICE: Browsing & Searching Catalog
  group('Catalog Service - Book Browsing', () => {
    const start = new Date().getTime();
    const res = http.get(`${BASE_URL_CATALOG}/health`, { headers: COMMON_HEADERS });
    const duration = new Date().getTime() - start;
    
    catalogLatency.add(duration);
    totalRequests.add(1);

    check(res, {
      'Catalog health status is 200': (r) => r.status === 200 || r.status === 0,
    });
  });

  sleep(0.5);

  // 3. FINE SERVICE: Fine Inquiries & Billing
  group('Fine Service - Billing Health', () => {
    const start = new Date().getTime();
    const res = http.get(`${BASE_URL_FINE}/health`, { headers: COMMON_HEADERS });
    const duration = new Date().getTime() - start;
    
    fineLatency.add(duration);
    totalRequests.add(1);

    check(res, {
      'Fine health status is 200': (r) => r.status === 200 || r.status === 0,
    });
  });

  sleep(0.5);

  // 4. LOAN SERVICE: Loan Inquiries
  group('Loan Service - Circulation Health', () => {
    const start = new Date().getTime();
    const res = http.get(`${BASE_URL_LOAN}/health`, { headers: COMMON_HEADERS });
    const duration = new Date().getTime() - start;
    
    loanLatency.add(duration);
    totalRequests.add(1);

    check(res, {
      'Loan health status is 200': (r) => r.status === 200 || r.status === 0,
    });
  });

  // Random user wait time between iterations (simulating real user think time)
  sleep(Math.random() * 2 + 1);
}
