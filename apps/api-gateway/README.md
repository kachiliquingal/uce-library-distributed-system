# 🌐 UCE Library - API Gateway & Reverse Proxy

![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Architecture](https://img.shields.io/badge/Role-Reverse_Proxy_%26_Load_Balancer-indigo?style=for-the-badge)

The **API Gateway** serves as the Single Point of Entry for the entire **UCE Library** distributed ecosystem. Built on **Nginx**, it is responsible for routing HTTP and WebSocket requests from clients (Web Frontend, Mobile App, and Desktop Kiosk Station) to the appropriate internal microservices within the private AWS / Docker network.

---

## 🏛️ Role in the Distributed Architecture

In our microservices architecture, exposing 10 individual services on different ports creates frontend complexity and security vulnerabilities. The API Gateway solves this by:
1. **Reverse Proxying:** Mapping clean public routes (`/api/auth/*`, `/api/catalog/*`, etc.) to internal container names and IP addresses.
2. **WebSocket & MQTT Support:** Enabling connection upgrades for real-time bidirectional communication (`Upgrade $http_upgrade`, `/mqtt`).
3. **Header & Security Management:** Injecting real client headers (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`) for auditing and traceability across backend services.

---

## 🗺️ Routing Table

| Public Route (`location`) | Target Service (Backend) | Internal Port | Description |
| :--- | :--- | :---: | :--- |
| `/api/auth/` | `auth-service` | `3001` | Authentication, JWT issuance, user registration, and security |
| `/api/catalog/` | `catalog-service` | `3002` | Bibliographic catalog of books, authors, and faculties |
| `/api/users/` | `user-service` | `3003` | Institutional user management and academic profiles |
| `/api/loans/` | `loan-service` | `3004` | Book circulation, borrow checkout, and return management |
| `/api/notifications/` | `notification-service` | `3005` | System alerts and real-time notification hub |
| `/api/fines/` | `fine-service` | `3006` | Late return penalty calculations and Stripe payment gateway |
| `/api/search/` | `search-service` | `3007` | Ultra-fast advanced search (ElasticSearch + Redis cache) |
| `/api/inventory/` | `inventory-service` | `3008` | Real-time physical book copy and shelf stock control |
| `/api/reports/` | `report-service` | `3009` | Dynamic PDF report generation and management analytics |
| `/api/reservations/` | `reservation-service` | `3010` | Waiting lists and reservation queues for out-of-stock books |
| `/mqtt` | `rabbitmq / broker` | `9001` | WebSocket proxy for IoT/MQTT telemetry and alerts |
| `/` | `frontend` | `80 / 3000` | Main Web SPA application (React + Vite) |

---

## ⚙️ Environment Variables & Configuration

The `nginx.conf.template` file utilizes dynamic environment variable substitution via `envsubst` upon container startup:

```ini
AUTH_SERVICE_URL=auth-service:3001
CATALOG_SERVICE_URL=catalog-service:3002
USER_SERVICE_URL=user-service:3003
LOAN_SERVICE_URL=loan-service:3004
NOTIFICATION_SERVICE_URL=notification-service:3005
FINE_SERVICE_URL=fine-service:3006
SEARCH_SERVICE_URL=search-service:3007
INVENTORY_SERVICE_URL=inventory-service:3008
REPORT_SERVICE_URL=report-service:3009
RESERVATION_SERVICE_URL=reservation-service:3010
FRONTEND_SERVICE_URL=frontend:80
BROKERS_IP=rabbitmq
```

---

## 🚀 How to Run Locally

### 1. With Docker (Recommended)
The API Gateway is fully integrated into the global dockerized environment:
```bash
# From the project root
docker-compose -f deploy/docker-compose.apps.yml up -d api-gateway
```

### 2. Health Verification
To verify that the Gateway is properly routing traffic:
```bash
curl -I http://localhost/api/catalog/books
# Should return HTTP/1.1 200 OK (or corresponding microservice status)
```

---
## 👨‍💻 Author & Developer

**Kleber Alejandro Chiliquinga Lara**  
*Course: Distributed Programming*  
Universidad Central del Ecuador (UCE)

---
*📚 UCE Library Distributed System - 2026*
