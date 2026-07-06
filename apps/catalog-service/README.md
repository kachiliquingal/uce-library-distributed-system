# 📚 MS-02: Catalog Service (Bibliographic Catalog Microservice)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)

The **Catalog Service (MS-02)** is the bibliographic metadata repository of **UCE Library**. Developed with **Node.js, TypeScript, and MongoDB**, it manages descriptive information for all literary, scientific, and academic resources across the faculties of Universidad Central del Ecuador.

---

## 🏛️ Why MongoDB (NoSQL Document Storage)

The bibliographic catalog is inherently polymorphic and highly variable:
- Technical books, scientific journals, university theses, and audiobooks possess distinct attributes (ISBN, ISSN, DOI, volume, page count, thesis advisors, repository URLs).
- **MongoDB** allows storing rich, flexible document schemas while efficiently indexing text for fast queries by title, author, publisher, publication year, and university faculty.

---

## 🏛️ Architecture & Code Structure

```
src/
├── domain/             # Catalog domain models and interfaces
│   └── models/         # BookModel (Mongoose schema with strict validations)
├── infrastructure/     # HTTP controllers and Express routes
│   ├── controllers/    # BookController (CRUD and filtering logic)
│   └── routes/         # Express route definitions
└── index.ts            # Entry point, MongoDB connection, and Swagger UI
```

---

## 🚀 Key Features

1. **Comprehensive Metadata Management:** Storage of title, author, ISBN, publisher, edition year, university faculty, and disciplinary category.
2. **Descriptive Search & Filtering:** Fast queries by unique ISBN or general keyword searches over the library collection.
3. **Synchronization with Physical Inventory:** Serves as the descriptive foundation for the `inventory-service` to link physical copies and shelf items.
4. **Swagger / OpenAPI Documentation:** Accessible and interactive API testing suite at `/api-docs`.

---

## 🔌 Main Endpoints

| Method | Endpoint | Description | Parameters / Request Body |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/catalog/books` | Retrieve the complete list of catalog books | Optional Query: `?faculty=...` |
| `GET` | `/api/catalog/books/:isbn` | Get detailed information for a book by ISBN | Path param: `isbn` |
| `POST` | `/api/catalog/books` | Create a new bibliographic record (Admin/Librarian only) | JSON Body with book metadata |
| `PUT` | `/api/catalog/books/:isbn` | Update book metadata or category | JSON Body |
| `DELETE` | `/api/catalog/books/:isbn` | Remove a bibliographic record from the catalog | Path param: `isbn` |
| `GET` | `/health` | Health check endpoint for AWS monitoring | N/A |

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `apps/catalog-service`:

```ini
PORT=3002
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/uce_library_catalog
```

---

## 🛠️ How to Run Locally

### 1. Installation & Execution
```bash
# Install dependencies
npm install

# Build TypeScript and start in development mode
npm run dev

# Build for production
npm run build
npm start
```

### 2. Unit Testing
The service includes automated unit tests for schemas and controllers:
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