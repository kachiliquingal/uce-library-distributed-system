# 📦 MS-06: Inventory Service (Physical Inventory Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

The **Inventory Service (MS-06)** is the stock and shelf availability controller for **UCE Library**. Built with **TypeScript and PostgreSQL**, it manages the exact number of physical book copies, library shelf locations, and real-time availability for circulation.

---

## 🏛️ Why PostgreSQL (Relational ACID & Concurrency Control)

Physical stock management is highly vulnerable to race conditions:
- If two students simultaneously attempt to borrow the last remaining copy of a book via the web portal and desktop kiosk, the system must guarantee that only one checkout succeeds.
- **PostgreSQL** enforces strict relational transactions and row-level locking (`FOR UPDATE` / ACID transactions) to ensure that the available copies counter (`availableCopies`) never drops below zero.

---

## 🏛️ Architecture & Separation of Concerns

In UCE Library, we intentionally decouple the **Catalog (MS-02)** from the **Inventory (MS-06)**:
- The **Catalog** stores abstract bibliographic metadata in NoSQL (MongoDB).
- The **Inventory** stores relational physical reality (PostgreSQL): How many physical copies exist in the Science library? How many are currently checked out? What is the barcode of each individual copy?

```
src/
├── domain/             # Stock entities (InventoryItem, BookCopy)
├── application/        # Use Cases (CheckAvailabilityUseCase, UpdateStockUseCase)
├── infrastructure/     # HTTP controllers and Postgres repositories
└── index.ts            # Express server initialization and database connection
```

---

## 🚀 Key Features

1. **Real-Time Stock Control:** Precise tracking of total copies (`totalCopies`) and copies available for borrowing (`availableCopies`).
2. **Loan Synchronization:** Responds to queries from the `loan-service` and Desktop Station to validate availability prior to checkout.
3. **Administrative Manual Adjustment:** Enables librarians to increment or decrement stock when new book batches arrive or damaged copies are retired.
4. **Swagger / OpenAPI Documentation:** Interactive API documentation accessible at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/inventory/:isbn` | Retrieve real physical stock and availability by ISBN | Path param: `isbn` |
| `PUT` | `/api/inventory/:isbn` | Update total or available stock (Admin/Librarian only) | JSON Body: `totalCopies`, `availableCopies` |
| `POST` | `/api/inventory/reserve/:isbn` | Temporarily decrement available copy count upon loan checkout | Path param: `isbn` |
| `POST` | `/api/inventory/release/:isbn` | Restore available copy count upon book return | Path param: `isbn` |
| `GET` | `/health` | Health check endpoint for AWS ALB | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/inventory-service`:

```ini
PORT=3008
NODE_ENV=development
DATABASE_URL=postgresql://postgres:secret@localhost:5432/uce_library_inventory
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build and start for production
npm run build
npm start
```

### 2. Unit Testing
Execute the stock integrity test suite:
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
