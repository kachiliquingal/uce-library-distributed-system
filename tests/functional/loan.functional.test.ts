import request from "supertest";
import express from "express";
import { Loan, LoanStatus } from "../../apps/loan-service/src/domain/Loan";

let mockLoans: Loan[] = [];

jest.mock("../../apps/loan-service/src/infrastructure/mysql/LoanRepositoryImpl", () => {
  return {
    LoanRepositoryImpl: class {
      async save(loan: Loan): Promise<Loan> {
        const idx = mockLoans.findIndex((l) => l.id === loan.id);
        if (idx !== -1) {
          mockLoans[idx] = loan;
        } else {
          mockLoans.push(loan);
        }
        return loan;
      }
      async findById(id: string): Promise<Loan | null> {
        return mockLoans.find((l) => l.id === id) || null;
      }
      async findByUserId(userId: string, page: number, limit: number): Promise<{ data: Loan[]; total: number }> {
        const filtered = mockLoans.filter((l) => l.userId === userId);
        return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
      }
      async findAllActive(page: number, limit: number): Promise<{ data: Loan[]; total: number }> {
        const filtered = mockLoans.filter((l) => l.status === LoanStatus.ACTIVE);
        return { data: filtered.slice((page - 1) * limit, page * limit), total: filtered.length };
      }
      async findAll(page: number, limit: number): Promise<{ data: Loan[]; total: number }> {
        return { data: mockLoans.slice((page - 1) * limit, page * limit), total: mockLoans.length };
      }
    },
  };
});

jest.mock("../../apps/loan-service/src/infrastructure/grpc/UserClient", () => ({
  UserClient: {
    validateUser: jest.fn().mockImplementation(async (userId: string) => {
      if (userId === "invalid-user") {
        return { isValid: false, name: "Unknown" };
      }
      return { isValid: true, name: "Alejandro Estudiante" };
    }),
  },
}));

jest.mock("../../apps/loan-service/src/infrastructure/messaging/Producers", () => ({
  KafkaProducer: {
    emit: jest.fn().mockResolvedValue(undefined),
  },
  RabbitMQProducer: {
    emit: jest.fn().mockResolvedValue(undefined),
  },
}));

import { loanRouter } from "../../apps/loan-service/src/infrastructure/http/routes";

describe("Loan Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockLoans = [];
    app = express();
    app.use(express.json());
    app.use("/api/loans", loanRouter as any);
  });

  const sampleBorrow = {
    userId: "user-100",
    isbn: "978-0132350884",
    bookTitle: "Clean Code",
    faculty: "Ingeniería",
  };

  test("POST /api/loans - Should borrow a book successfully", async () => {
    const res = await request(app).post("/api/loans").send(sampleBorrow);
    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(sampleBorrow.userId);
    expect(res.body.isbn).toBe(sampleBorrow.isbn);
    expect(res.body.status).toBe("ACTIVE");
    expect(res.body.id).toBeDefined();
  });

  test("POST /api/loans - Should reject borrow if user validation fails", async () => {
    const res = await request(app)
      .post("/api/loans")
      .send({ ...sampleBorrow, userId: "invalid-user" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User is not valid or does not exist");
  });

  test("POST /api/loans - Should reject borrow if user already borrowed the same book actively", async () => {
    await request(app).post("/api/loans").send(sampleBorrow);
    const res = await request(app).post("/api/loans").send(sampleBorrow);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("User already has an active loan for this book");
  });

  test("PUT /api/loans/:id/return - Should return a borrowed book successfully", async () => {
    const createRes = await request(app).post("/api/loans").send(sampleBorrow);
    const loanId = createRes.body.id;

    const res = await request(app).put(`/api/loans/${loanId}/return`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RETURNED");
    expect(res.body.returnDate).toBeDefined();
  });

  test("PUT /api/loans/:id/return - Should return 400 for non-existent loan ID", async () => {
    const res = await request(app).put("/api/loans/non-existent-id/return");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Loan not found");
  });

  test("GET /api/loans/user/:userId - Should retrieve loans for a specific user", async () => {
    await request(app).post("/api/loans").send(sampleBorrow);
    await request(app).post("/api/loans").send({
      ...sampleBorrow,
      isbn: "978-0134494166",
    });

    const res = await request(app).get("/api/loans/user/user-100");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.total).toBe(2);
  });

  test("GET /api/loans - Should retrieve all loans and filter by activeOnly", async () => {
    const res1 = await request(app).post("/api/loans").send(sampleBorrow);
    await request(app).post("/api/loans").send({
      ...sampleBorrow,
      isbn: "978-0134494166",
    });

    // Return the first book
    await request(app).put(`/api/loans/${res1.body.id}/return`);

    const allRes = await request(app).get("/api/loans");
    expect(allRes.status).toBe(200);
    expect(allRes.body.total).toBe(2);

    const activeRes = await request(app).get("/api/loans?activeOnly=true");
    expect(activeRes.status).toBe(200);
    expect(activeRes.body.total).toBe(1);
    expect(activeRes.body.data[0].isbn).toBe("978-0134494166");
  });
});
