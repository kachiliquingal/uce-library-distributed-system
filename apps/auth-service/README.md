# 🔐 MS-01: Auth Service (Authentication & Security Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

The **Auth Service (MS-01)** is the security and access control pillar of the **UCE Library** distributed system. Implemented following clean **Hexagonal Architecture** principles, it manages institutional user identity, cryptographic password hashing with **bcrypt**, and the issuance/validation of **JSON Web Tokens (JWT)** for stateless authentication across the entire ecosystem.

---

## 🏛️ Internal Architecture (Hexagonal / Clean Architecture)

The microservice is structured cleanly to decouple business rules from infrastructure details:

```
src/
├── domain/             # Business core (Entities, Ports, and Exceptions)
├── application/        # Use Cases (LoginUserUseCase, RegisterUserUseCase)
└── infrastructure/     # External technology adapters
    ├── controllers/    # AuthController (Express HTTP handling)
    ├── adapters/       # BcryptPasswordHasher, JwtTokenService
    ├── repositories/   # MySQLUserRepository (TypeORM / MySQL)
    └── routes/         # HTTP routes and Swagger documentation
```

---

## 🚀 Key Features

1. **Stateless JWT Authentication:** Issuance of signed tokens containing role claims (`USER`, `ADMIN`, `LIBRARIAN`) for Role-Based Access Control (RBAC) across all services.
2. **Cryptographic Security:** Secure password hashing using `bcryptjs` with high-cost salting to safeguard university credentials.
3. **Standardized Error Handling:** Clear HTTP responses for duplicate emails (HTTP 409), invalid credentials (HTTP 401), and expired tokens.
4. **OpenAPI / Swagger Documentation:** Interactive API documentation accessible at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Request Body / Headers |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new institutional user | `{ "email": "...", "password": "...", "role": "USER" }` |
| `POST` | `/api/auth/login` | Log in and obtain a signed JWT token | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/validate` | Validate JWT token for gateways or microservices | Header: `Authorization: Bearer <token>` |
| `GET` | `/health` | Health check endpoint for AWS ALB monitoring | N/A |
| `GET` | `/api-docs` | Interactive Swagger UI documentation | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/auth-service`:

```ini
PORT=3001
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_uce_library_2026
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=uce_library_auth
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
The service includes a comprehensive Jest automated test suite:
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