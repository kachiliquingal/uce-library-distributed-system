# 🎯 MS-08: Reservation Service (Waiting Lists & Reservations Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)

The **Reservation Service (MS-08)** manages book holds and waiting queues for **UCE Library**. Developed in **TypeScript and MySQL**, it handles waiting lists whenever a book's physical stock is depleted, automatically notifying the next student in line as soon as a copy is returned at the library counter.

---

## 🏛️ Why MySQL (Relational ACID & Strict Ordering)

Waiting queue management requires strict fairness and chronological order:
- The right to borrow an out-of-stock book must strictly follow First-In, First-Out (FIFO) arrival order.
- **MySQL (TypeORM)** guarantees that reservation timestamps (`reservationDate`) maintain immutable ordering protected by database transactions.

---

## 🏛️ Architecture & Waiting Queue Flow

```
src/
├── domain/             # Reservation entity and statuses (PENDING, NOTIFIED, COMPLETED, CANCELLED)
├── application/        # Use Cases (CreateReservationUseCase, NotifyNextInQueueUseCase)
├── infrastructure/     # HTTP controllers, RabbitMQ adapters, and MySQL repositories
└── index.ts            # Global initialization
```

- **Queue Synchronization (RabbitMQ):** When the `loan-service` processes a book return, it emits an event captured by this service. If a waiting queue exists for that ISBN, the first pending reservation transitions to `NOTIFIED`, and a command is dispatched to `notification-service` to alert the student via mobile push.

---

## 🚀 Key Features

1. **Strict FIFO Management:** Ensures that returned books are assigned fairly based on the exact order of request on the web portal.
2. **Time-Window Expiration:** Grants an institutional time window for notified students to claim their reserved book; if expired, priority automatically passes to the next student in the queue.
3. **Dynamic Cancellation:** Allows students to cancel pending reservations at any time from their web profile.
4. **Swagger / OpenAPI Documentation:** Available for interactive testing at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/reservations` | Create a new reservation for an out-of-stock book | JSON Body: `userId`, `isbn` |
| `GET` | `/api/reservations/user/:userId` | Get active reservation list for a student | Path param: `userId` |
| `DELETE` | `/api/reservations/:id` | Cancel a pending reservation in the queue | Path param: `id` |
| `GET` | `/health` | Microservice health check endpoint for AWS | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/reservation-service`:

```ini
PORT=3010
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=uce_library_reservations
RABBITMQ_URL=amqp://localhost:5672
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
The service includes Jest unit tests to validate FIFO queue logic:
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
