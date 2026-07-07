# 👥 MS-10: User Service (User Management & Profile Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=for-the-badge&logo=grpc&logoColor=white)

The **User Service (MS-10)** is the institutional identity, RBAC role, and academic profile repository of **UCE Library**. Developed in **TypeScript and MySQL**, it stores detailed records for students, professors, and librarians at Universidad Central del Ecuador, operating simultaneously as a high-speed **gRPC** server for internal microservice validations.

---

## 🏛️ Why MySQL (Relational ACID & Structured Integrity)

Personal and academic data across the university community requires highly structured schemas:
- User entities maintain strict relational links to faculties, academic careers, institutional roles, and activity statuses.
- **MySQL (TypeORM)** guarantees compliance with uniqueness constraints (e.g., `@uce.edu.ec` email addresses) and enforces referential integrity for administrative auditing.

---

## 🏛️ Architecture & Integrated gRPC Server

Unlike traditional REST/HTTP calls (which introduce JSON serialization latency and header overhead), the `user-service` implements an embedded **gRPC (Protocol Buffers)** Remote Procedure Call server on port `50051`:

```
src/
├── domain/             # UserProfile entity and institutional roles
├── application/        # Use Cases (GetUserProfileUseCase, UpdateUserUseCase)
├── infrastructure/     # Communication adapters
│   ├── grpc/           # UserGrpcServer (Handles ultra-fast validations for loan-service)
│   ├── mysql/          # UserRepositoryImpl (Persistence with TypeORM)
│   └── http/           # Express routes and controllers
└── index.ts            # Dual initialization (HTTP on port 3003, gRPC on port 50051)
```

- **Why gRPC with Loan Service:** When a student attempts to borrow a book at the library counter, `loan-service` instantly queries `user-service` via gRPC to verify that the student is legally matriculated and free of disciplinary holds in mere microseconds.

---

## 🚀 Key Features

1. **University Profile Management:** Storage of full names, academic career, faculty, university ID number, and institutional status.
2. **High-Speed gRPC Server:** Dedicated port (`50051`) for secure internal inter-service communication within Docker/AWS networks.
3. **Administrative Control:** Enables librarians and administrators to manage onboarding, deactivations, and institutional role modifications.
4. **Swagger / OpenAPI Documentation:** Accessible at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/users/:id` | Retrieve public and institutional profile of a user | Path param: `id` |
| `PUT` | `/api/users/:id` | Update personal information or academic faculty | JSON Body |
| `GET` | `/api/users` | List all registered users (Admin/Librarian only) | Query: `?page=1&limit=10` |
| `DELETE` | `/api/users/:id` | Deactivate or remove a user from the library system | Path param: `id` |
| `GET` | `/health` | Microservice health check endpoint for AWS ALB | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/user-service`:

```ini
PORT=3003
GRPC_PORT=50051
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=uce_library_users
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
Execute the automated Jest test suite:
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
