# 📖 MS-04: Loan Service (Loans & Circulation Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=for-the-badge&logo=grpc&logoColor=white)

The **Loan Service (MS-04)** is the operational core of the **UCE Library** distributed system. Built with **TypeScript and MySQL**, it manages book circulation lifecycles, implementing hexagonal architecture, high-speed inter-service communication via **gRPC**, and asynchronous event broadcasting via **Apache Kafka**.

---

## 🏛️ Why MySQL (Relational ACID & Circulation Traceability)

The history of loans and returns represents the official audit record of university public assets:
- Strict relational integrity is required to guarantee that each loan corresponds to a valid institutional user and a registered book ISBN.
- **MySQL (TypeORM)** ensures that checkout dates (`borrowDate`), estimated due dates (`dueDate`), and actual return dates (`returnDate`) remain immutable and transactionally protected.

---

## 🏛️ Architecture & Hybrid Communication (gRPC + Kafka)

```
src/
├── domain/             # Loan entity and statuses (ACTIVE, RETURNED, OVERDUE)
├── application/        # Use Cases (BorrowBookUseCase, ReturnBookUseCase, GetLoansUseCase)
├── infrastructure/     # Communication adapters
│   ├── grpc/           # UserClient (Validates institutional identity against MS-10 via gRPC)
│   ├── messaging/      # KafkaProducer (Emits book.borrowed and book.returned events)
│   ├── mysql/          # LoanRepositoryImpl (Persistence with TypeORM)
│   └── http/           # Express routes and controllers
└── index.ts            # Global initialization
```

### 1. Identity Validation via gRPC
Before authorizing a book loan in `BorrowBookUseCase`, the service performs a high-performance Remote Procedure Call (**gRPC**) to the **User Service (MS-10)** to verify that the student exists and is actively enrolled in the university.

### 2. Event Broadcasting via Kafka
Upon a successful book loan or return, the service broadcasts asynchronous messages to the `book.borrowed` and `book.returned` topics. These events are consumed by the **Notification Service (MS-03)** to trigger real-time alerts (mobile and MQTT) and by the **Fine Service (MS-05)** if a late return is detected.

---

## 🚀 Key Features

1. **Automated Circulation (Checkout / Return):** Instant loan registration with automated due date calculation.
2. **Flexible Queries:** Support for pagination and status filtering (`activeOnly`) for administrative and desktop interfaces.
3. **Duplication Control:** Prevents students from simultaneously borrowing two copies of the same book.
4. **Swagger / OpenAPI Documentation:** Interactive API testing suite accessible at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/loans` | Create a new loan checkout | JSON Body: `userId`, `isbn`, `bookTitle`, `faculty` |
| `PUT` | `/api/loans/:id/return` | Register the return of a borrowed book | Path param: `id` |
| `GET` | `/api/loans/user/:userId` | Get loan history for a student (Paginated) | Path: `userId`, Query: `?page=1&limit=10` |
| `GET` | `/api/loans` | Retrieve all system loans (Admin/Librarian only) | Query: `?activeOnly=false&page=1&limit=10` |
| `GET` | `/health` | Microservice health check endpoint for AWS | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/loan-service`:

```ini
PORT=3004
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=uce_library_loans
KAFKA_BROKERS=localhost:9092
USER_GRPC_URL=localhost:50051
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
The service includes Jest tests with mocks for gRPC and Kafka:
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
