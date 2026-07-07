import request from "supertest";
import express from "express";
import { PhysicalStock } from "../../apps/inventory-service/src/domain/PhysicalStock";

let mockStocks: PhysicalStock[] = [];

jest.mock("../../apps/inventory-service/src/infrastructure/database/CouchDBAdapter", () => {
  return {
    CouchDBAdapter: class {
      async save(stock: PhysicalStock): Promise<void> {
        const idx = mockStocks.findIndex((s) => s.isbn === stock.isbn);
        if (idx !== -1) {
          mockStocks[idx] = stock;
        } else {
          mockStocks.push(stock);
        }
      }
      async findByIsbn(isbn: string): Promise<PhysicalStock | null> {
        return mockStocks.find((s) => s.isbn === isbn) || null;
      }
      async findLowStock(threshold: number = 5): Promise<PhysicalStock[]> {
        return mockStocks.filter((s) => s.availableCopies < threshold);
      }
    },
  };
});

jest.mock("../../apps/inventory-service/src/infrastructure/grpc/CatalogGrpcClient", () => {
  return {
    CatalogGrpcClient: class {
      async validateIsbn(isbn: string): Promise<boolean> {
        if (isbn === "999-invalid-isbn") return false;
        return true;
      }
    },
  };
});

import { inventoryRouter } from "../../apps/inventory-service/src/infrastructure/http/routes/index";

describe("Inventory Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockStocks = [];
    app = express();
    app.use(express.json());
    app.use("/api/inventory", inventoryRouter);
  });

  const sampleStock = {
    isbn: "978-0132350884",
    initialCopies: 10,
    shelfLocation: "Estante A-3, Piso 2",
  };

  test("GET /api/inventory - Should return health status", async () => {
    const res = await request(app).get("/api/inventory");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Inventory Service API");
  });

  test("POST /api/inventory - Should create physical stock for a valid cataloged book", async () => {
    const res = await request(app).post("/api/inventory").send(sampleStock);
    expect(res.status).toBe(201);
    expect(res.body.isbn).toBe(sampleStock.isbn);
    expect(res.body.totalCopies).toBe(10);
    expect(res.body.availableCopies).toBe(10);
  });

  test("POST /api/inventory - Should return 400 if ISBN is not found in catalog", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({ ...sampleStock, isbn: "999-invalid-isbn" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not found in Catalog");
  });

  test("POST /api/inventory - Should return 400 if stock already exists for ISBN", async () => {
    await request(app).post("/api/inventory").send(sampleStock);
    const res = await request(app).post("/api/inventory").send(sampleStock);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already exists");
  });

  test("GET /api/inventory/:isbn - Should retrieve stock details by ISBN", async () => {
    await request(app).post("/api/inventory").send(sampleStock);
    const res = await request(app).get(`/api/inventory/${sampleStock.isbn}`);
    expect(res.status).toBe(200);
    expect(res.body.isbn).toBe(sampleStock.isbn);
    expect(res.body.shelfLocation).toBe(sampleStock.shelfLocation);
  });

  test("GET /api/inventory/:isbn - Should return 404 for non-existent stock", async () => {
    const res = await request(app).get("/api/inventory/000-non-existent");
    expect(res.status).toBe(404);
  });

  test("PUT /api/inventory/:isbn/stock - Should add copies to existing stock", async () => {
    await request(app).post("/api/inventory").send(sampleStock);
    const res = await request(app)
      .put(`/api/inventory/${sampleStock.isbn}/stock`)
      .send({ copiesToAdd: 5 });

    expect(res.status).toBe(200);
    expect(res.body.totalCopies).toBe(15);
    expect(res.body.availableCopies).toBe(15);
  });

  test("GET /api/inventory/low-stock - Should retrieve books below stock threshold", async () => {
    await request(app).post("/api/inventory").send({
      isbn: "978-low-stock-1",
      initialCopies: 2,
      shelfLocation: "Estante B-1",
    });
    await request(app).post("/api/inventory").send({
      isbn: "978-high-stock-2",
      initialCopies: 20,
      shelfLocation: "Estante B-2",
    });

    const res = await request(app).get("/api/inventory/low-stock?threshold=5");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].isbn).toBe("978-low-stock-1");
  });

  test("POST /api/inventory/sync-legacy-loans - Should sync legacy loans to 0 available copies", async () => {
    await request(app).post("/api/inventory").send({
      isbn: "9780132350884",
      initialCopies: 10,
      shelfLocation: "Estante C-1",
    });

    const res = await request(app)
      .post("/api/inventory/sync-legacy-loans")
      .send({ isbns: ["9780132350884"] });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Legacy loans sync completed");
    expect(res.body.results[0].availableCopies).toBe(0);
  });
});
