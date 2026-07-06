# 📊 MS-07: Report Service (Analytics & PDF Report Generation Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-FF0000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)

The **Report Service (MS-07)** is the business intelligence, management analytics, and document export hub of **UCE Library**. Built with **TypeScript, PostgreSQL, and PDFKit**, it processes global library circulation metrics and generates official, high-definition PDF reports in real time.

---

## 🏛️ Why PostgreSQL (Relational ACID & Complex Analytical Queries)

Management analytics and statistical reporting require advanced SQL aggregation and join capabilities:
- It is necessary to consolidate historical data regarding most borrowed books, faculties with the highest reading indexes, accumulated late returns, and collected fine revenues.
- **PostgreSQL** features a powerful analytical query engine with support for materialized views and advanced indexing, allowing reports to be generated without degrading transactional performance across other services.

---

## 🏛️ Architecture & Document Generation

```
src/
├── domain/             # Analytical entities and date range filters
├── application/        # Use Cases (GeneratePDFReportUseCase, GetDashboardStatsUseCase)
├── infrastructure/     # HTTP controllers, PDFKit engine, and Postgres repositories
└── index.ts            # Express server initialization
```

---

## 🚀 Key Features

1. **High-Management Statistics:** Dynamic calculation of institutional metrics for the administrative dashboard at Universidad Central del Ecuador.
2. **On-the-Fly PDF Generation:** Instant report compilation in memory using `PDFKit`, streaming direct binary data (`application/pdf`) without storing residual files on the server disk.
3. **Custom Filtering:** Ability to generate reports bounded by date ranges, university faculty, or transaction type.
4. **Swagger / OpenAPI Documentation:** Available for interactive testing and document downloading at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Headers |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/reports/stats` | Retrieve JSON statistical summary for the Dashboard | Query: `?startDate=...&endDate=...` |
| `GET` | `/api/reports/export/pdf` | Generate and download the official PDF report | Header: `Authorization: Bearer <token>` |
| `GET` | `/health` | Health check endpoint for AWS monitoring | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/report-service`:

```ini
PORT=3009
NODE_ENV=development
DATABASE_URL=postgresql://postgres:secret@localhost:5432/uce_library_reports
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
The service includes Jest automated tests to validate statistical calculations:
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
