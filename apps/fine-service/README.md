# ⚠️ MS-05: Fine Service (Fines & Monetary Penalties Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)

The **Fine Service (MS-05)** is the financial and penalty engine of **UCE Library**. Developed in **TypeScript with PostgreSQL**, it automatically calculates fines for overdue books, manages student monetary records, and integrates online credit card payments via the **Stripe** payment gateway.

---

## 🏛️ Why PostgreSQL (Relational ACID & Financial Precision)

Fines and payment tracking require the highest level of referential integrity and transactional safety:
- Monetary amounts, payment transactions, invoice numbers, and outstanding balances cannot tolerate race conditions or concurrency anomalies.
- **PostgreSQL** provides strict **ACID** transactional guarantees and high-precision data types for monetary operations and institutional financial auditing.

---

## 🏛️ Architecture & Event-Driven Communication

```
src/
├── domain/             # Financial entities (Fine, FineStatus: PENDING/PAID)
├── application/        # Use Cases (CreateFineUseCase, PayFineUseCase, GetFinesUseCase)
├── infrastructure/     # HTTP controllers, Stripe adapters, and Postgres repositories
└── index.ts            # TypeORM initialization, Swagger, and event consumer
```

- **Event Queue Consumption (RabbitMQ / Kafka):** Listens for overdue return events (`fine.trigger` or `book.overdue`) emitted by the loan microservice to automatically generate monetary penalties without manual intervention.

---

## 🚀 Key Features

1. **Automated Late Fee Calculation:** Generates penalties by calculating exact overdue days past the due date.
2. **Stripe Gateway Integration:** Secure online payment processing to settle fines using credit or debit cards from the web application.
3. **Institutional Borrowing Lock:** Alerts the university system regarding users with unpaid fines, preventing new book loans until balances are settled.
4. **OpenAPI / Swagger Documentation:** Available for interactive testing at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/fines` | Retrieve all system fines (Admin/Librarian only) | Query: `?page=1&limit=10` |
| `GET` | `/api/fines/user/:userId` | Get fine history for a specific student | Path param: `userId` |
| `POST` | `/api/fines` | Create a new fine manually or via event trigger | JSON Body: `userId`, `amount`, `reason` |
| `PUT` | `/api/fines/:id/pay` | Register payment and update status to `PAID` | Path param: `id`, Body: `paymentMethod` |
| `POST` | `/api/fines/create-payment-intent` | Create a secure Stripe payment intent | JSON Body: `amount`, `currency` |
| `GET` | `/health` | Microservice health check endpoint | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/fine-service`:

```ini
PORT=3006
NODE_ENV=development
DATABASE_URL=postgresql://postgres:secret@localhost:5432/uce_library_fines
STRIPE_SECRET_KEY=sk_test_mock_stripe_key_uce_2026
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build and run for production
npm run build
npm start
```

### 2. Unit Testing
The service includes Jest automated tests to validate late fee calculations:
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
