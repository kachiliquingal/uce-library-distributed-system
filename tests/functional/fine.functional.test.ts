import request from "supertest";
import express from "express";

let mockFines: any[] = [];

jest.mock("pg", () => {
  const mPool = {
    query: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
      if (sql.includes("CREATE TABLE")) return { rows: [] };
      if (sql.includes("INSERT INTO fines")) {
        mockFines.push({
          id: params?.[0],
          user_id: params?.[1],
          loan_id: params?.[2],
          amount: params?.[3],
          reason: params?.[4],
          status: params?.[5],
          stripe_payment_intent_id: params?.[6],
          created_at: params?.[7] || new Date(),
        });
        return { rows: [] };
      }
      if (sql.includes("SELECT * FROM fines WHERE id")) {
        const found = mockFines.find((f) => f.id === params?.[0]);
        return { rows: found ? [found] : [] };
      }
      if (sql.includes("SELECT * FROM fines WHERE user_id")) {
        const found = mockFines.filter((f) => f.user_id === params?.[0]);
        return { rows: found };
      }
      if (sql.includes("SELECT * FROM fines")) {
        return { rows: mockFines };
      }
      if (sql.includes("UPDATE fines")) {
        const found = mockFines.find((f) => f.id === params?.[2]);
        if (found) {
          found.status = params?.[0];
          found.stripe_payment_intent_id = params?.[1];
        }
        return { rows: [] };
      }
      return { rows: [] };
    }),
  };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: "pi_mock_12345",
        client_secret: "secret_mock_12345",
      }),
    },
  }));
});

jest.mock("../../apps/fine-service/src/infrastructure/messaging/KafkaProducer", () => ({
  KafkaProducer: {
    emit: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("../../apps/fine-service/src/infrastructure/http/UserClient", () => ({
  UserClient: {
    getUserName: jest.fn().mockResolvedValue("Alejandro Estudiante"),
  },
}));

import { fineRouter } from "../../apps/fine-service/src/infrastructure/http/routes";

describe("Fine Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockFines = [];
    app = express();
    app.use((req, res, next) => {
      if (req.path.includes("webhook")) return next();
      return express.json()(req, res, next);
    });
    app.use("/api/fines", fineRouter);
    app.use((err: any, req: any, res: any, next: any) => {
      console.error(">>> EXPRESS ROUTE ERROR:", err.stack || err);
      res.status(500).json({ error: err.message });
    });
  });

  test("POST /api/fines/mock - Should create a mock fine for testing", async () => {
    const res = await request(app)
      .post("/api/fines/mock")
      .send({
        userId: "user-100",
        amount: 15.5,
        reason: "Late return of clean code",
      });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe("user-100");
    expect(res.body.amount).toBe(15.5);
    expect(res.body.status).toBe("UNPAID");
  });

  test("POST /api/fines/mock - Should return 400 when userId is missing", async () => {
    const res = await request(app)
      .post("/api/fines/mock")
      .send({ amount: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("userId is required");
  });

  test("GET /api/fines/user/:userId - Should retrieve all fines for a user", async () => {
    await request(app).post("/api/fines/mock").send({ userId: "user-100", amount: 5 });
    await request(app).post("/api/fines/mock").send({ userId: "user-100", amount: 10 });
    await request(app).post("/api/fines/mock").send({ userId: "user-200", amount: 3 });

    const res = await request(app).get("/api/fines/user/user-100");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("GET /api/fines - Should retrieve all system fines", async () => {
    await request(app).post("/api/fines/mock").send({ userId: "user-100", amount: 5 });
    await request(app).post("/api/fines/mock").send({ userId: "user-200", amount: 20 });

    const res = await request(app).get("/api/fines");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("POST /api/fines/:id/pay - Should generate a Stripe payment client secret", async () => {
    const createRes = await request(app)
      .post("/api/fines/mock")
      .send({ userId: "user-100", amount: 25 });
    const fineId = createRes.body.id;

    const res = await request(app).post(`/api/fines/${fineId}/pay`);
    expect(res.status).toBe(200);
    expect(res.body.clientSecret).toBe("secret_mock_12345");
  });

  test("POST /api/fines/webhook - Should confirm payment on Stripe webhook event", async () => {
    const createRes = await request(app)
      .post("/api/fines/mock")
      .send({ userId: "user-100", amount: 25 });
    const fineId = createRes.body.id;

    // Link stripe_payment_intent_id
    await request(app).post(`/api/fines/${fineId}/pay`);

    const webhookPayload = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_mock_12345",
          amount: 2500,
          metadata: {
            fineId,
            loanId: "loan-123",
            userId: "user-100",
          },
        },
      },
    };

    const res = await request(app).post("/api/fines/webhook").send(webhookPayload);
    expect(res.status).toBe(200);
    expect(res.text).toBe("Event received");
  });
});
