import request from "supertest";
import express from "express";

let mockMetrics: any[] = [];

jest.mock("../../apps/report-service/src/infrastructure/database/InfluxDBAdapter", () => {
  return {
    InfluxDBAdapter: class {
      async saveMetric(metric: any): Promise<void> {
        mockMetrics.push(metric);
      }
      async getLoansPerDay(days = 7) {
        return [
          { date: "2026-07-05", count: 12 },
          { date: "2026-07-06", count: 18 },
        ];
      }
      async getTopBorrowedBooks(limit = 5) {
        return [
          { isbn: "978-0132350884", title: "Clean Code", count: 25 },
          { isbn: "978-1449373320", title: "Designing Data-Intensive Applications", count: 20 },
        ];
      }
      async getActiveUsersCount(days = 30) {
        return 42;
      }
      async getFineRevenueSummary() {
        return {
          totalRevenue: 150.5,
          paidFinesCount: 15,
          unpaidFinesCount: 3,
        };
      }
    },
  };
});

import reportRouter from "../../apps/report-service/src/infrastructure/http/routes/index";

describe("Report Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockMetrics = [];
    app = express();
    app.use(express.json());
    app.use("/api/reports", reportRouter);
  });

  test("GET /api/reports/summary - Should retrieve complete dashboard analytics summary", async () => {
    const res = await request(app).get("/api/reports/summary");
    expect(res.status).toBe(200);
    expect(res.body.loansPerDay).toBeDefined();
    expect(res.body.topBooks).toBeDefined();
    expect(res.body.activeUsers).toBe(42);
    expect(res.body.fineRevenue.totalRevenue).toBe(150.5);
    expect(res.body.timestamp).toBeDefined();
  });

  test("GET /api/reports/loans-per-day - Should retrieve daily loan statistics", async () => {
    const res = await request(app).get("/api/reports/loans-per-day?days=7");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[1].count).toBe(18);
  });

  test("GET /api/reports/top-books - Should retrieve top borrowed books", async () => {
    const res = await request(app).get("/api/reports/top-books?limit=5");
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Clean Code");
    expect(res.body[0].count).toBe(25);
  });

  test("GET /api/reports/active-users - Should retrieve active users count", async () => {
    const res = await request(app).get("/api/reports/active-users?days=30");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(42);
    expect(res.body.periodDays).toBe(30);
  });

  test("GET /api/reports/fine-revenue - Should retrieve fine revenue summary", async () => {
    const res = await request(app).get("/api/reports/fine-revenue");
    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBe(150.5);
    expect(res.body.paidFinesCount).toBe(15);
  });

  test("POST /api/reports/record - Should record a custom metric event successfully", async () => {
    const res = await request(app)
      .post("/api/reports/record")
      .send({
        measurement: "book_viewed",
        tags: { isbn: "978-0132350884", faculty: "Ingeniería" },
        fields: { count: 1 },
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Metric recorded successfully");
  });

  test("POST /api/reports/record - Should return 400 when measurement name is missing", async () => {
    const res = await request(app)
      .post("/api/reports/record")
      .send({
        tags: { isbn: "978-0132350884" },
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("measurement is required");
  });
});
