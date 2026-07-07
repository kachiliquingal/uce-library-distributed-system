import request from "supertest";
import express from "express";

let mockBooks: any[] = [];
let idCounter = 1;

jest.mock("../../apps/catalog-service/src/infrastructure/database/BookModel", () => {
  class MockModel {
    [key: string]: any;
    constructor(data: any) {
      Object.assign(this, data);
      this.id = String(idCounter++);
      this.save = jest.fn().mockImplementation(async () => {
        mockBooks.push(this);
        return this;
      });
    }

    toJSON() {
      return {
        id: this.id,
        title: this.title,
        author: this.author,
        isbn: this.isbn,
        publishedYear: this.publishedYear,
        category: this.category,
        available: this.available,
      };
    }

    static find = jest.fn().mockImplementation(async () =>
      mockBooks.map((b) => b)
    );
    static findOne = jest.fn().mockImplementation(async (query: any) => {
      const found = mockBooks.find((b) => b.isbn === query.isbn);
      return found || null;
    });
    static findById = jest.fn().mockImplementation(async (id: string) => {
      const found = mockBooks.find((b) => b.id === id);
      return found || null;
    });
    static distinct = jest.fn().mockImplementation(async (field: string) => {
      return Array.from(new Set(mockBooks.map((b) => b[field])));
    });
    static findByIdAndUpdate = jest.fn().mockImplementation(async (id: string, update: any) => {
      const idx = mockBooks.findIndex((b) => b.id === id);
      if (idx === -1) return null;
      Object.assign(mockBooks[idx], update);
      return mockBooks[idx];
    });
    static findByIdAndDelete = jest.fn().mockImplementation(async (id: string) => {
      const idx = mockBooks.findIndex((b) => b.id === id);
      if (idx === -1) return null;
      return mockBooks.splice(idx, 1)[0];
    });
  }

  return { BookModel: MockModel };
});

jest.mock("../../apps/catalog-service/src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

import bookRoutes from "../../apps/catalog-service/src/infrastructure/routes/bookRoutes";

describe("Catalog Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockBooks = [];
    idCounter = 1;
    app = express();
    app.use(express.json());
    app.use("/api/catalog/books", bookRoutes);
  });

  const sampleBook = {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    isbn: "978-1449373320",
    publishedYear: 2017,
    category: "Distributed Systems",
    available: true,
  };

  test("POST /api/catalog/books - Should create a new book successfully", async () => {
    const res = await request(app)
      .post("/api/catalog/books")
      .send(sampleBook);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(sampleBook.title);
    expect(res.body.isbn).toBe(sampleBook.isbn);
    expect(res.body.id).toBeDefined();
  });

  test("POST /api/catalog/books - Should reject duplicate ISBN", async () => {
    await request(app).post("/api/catalog/books").send(sampleBook);

    const res = await request(app)
      .post("/api/catalog/books")
      .send({ ...sampleBook, title: "Duplicate ISBN Book" });

    expect(res.status).toBe(400); // Or 409 depending on error handling
    expect(res.body.error).toBeDefined();
  });

  test("GET /api/catalog/books - Should retrieve all cataloged books", async () => {
    await request(app).post("/api/catalog/books").send(sampleBook);
    await request(app).post("/api/catalog/books").send({
      ...sampleBook,
      title: "Clean Code",
      isbn: "978-0132350884",
    });

    const res = await request(app).get("/api/catalog/books");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("GET /api/catalog/books/authors - Should retrieve distinct authors", async () => {
    await request(app).post("/api/catalog/books").send(sampleBook);
    await request(app).post("/api/catalog/books").send({
      ...sampleBook,
      title: "Clean Architecture",
      author: "Robert C. Martin",
      isbn: "978-0134494166",
    });

    const res = await request(app).get("/api/catalog/books/authors");
    expect(res.status).toBe(200);
    expect(res.body).toContain("Martin Kleppmann");
    expect(res.body).toContain("Robert C. Martin");
    expect(res.body.length).toBe(2);
  });

  test("GET /api/catalog/books/:id - Should retrieve book details by ID", async () => {
    const createRes = await request(app).post("/api/catalog/books").send(sampleBook);
    const bookId = createRes.body.id;

    const res = await request(app).get(`/api/catalog/books/${bookId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(bookId);
    expect(res.body.title).toBe(sampleBook.title);
  });

  test("GET /api/catalog/books/:id - Should return 404 for non-existent ID", async () => {
    const res = await request(app).get("/api/catalog/books/999");
    expect(res.status).toBe(404);
  });

  test("PUT /api/catalog/books/:id - Should update book metadata", async () => {
    const createRes = await request(app).post("/api/catalog/books").send(sampleBook);
    const bookId = createRes.body.id;

    const res = await request(app)
      .put(`/api/catalog/books/${bookId}`)
      .send({ title: "Designing Data-Intensive Applications (2nd Ed)" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Designing Data-Intensive Applications (2nd Ed)");
  });

  test("DELETE /api/catalog/books/:id - Should delete a book from catalog", async () => {
    const createRes = await request(app).post("/api/catalog/books").send(sampleBook);
    const bookId = createRes.body.id;

    const delRes = await request(app).delete(`/api/catalog/books/${bookId}`);
    expect(delRes.status).toBe(204);

    const checkRes = await request(app).get(`/api/catalog/books/${bookId}`);
    expect(checkRes.status).toBe(404);
  });
});
