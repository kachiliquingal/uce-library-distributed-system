import request from "supertest";
import express from "express";
import { createAuthRouter } from "../../apps/auth-service/src/infrastructure/routes/authRoutes";

jest.mock("../../apps/auth-service/src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe("Auth Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;
  let mockUsers: any[] = [];

  beforeEach(() => {
    mockUsers = [];
    const mockPgClient = {
      query: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes("SELECT * FROM users WHERE email = $1")) {
          const found = mockUsers.find(u => u.email === params?.[0]);
          return { rows: found ? [found] : [] };
        }
        if (sql.includes("SELECT * FROM users WHERE id = $1")) {
          const found = mockUsers.find(u => u.id === params?.[0]);
          return { rows: found ? [found] : [] };
        }
        if (sql.includes("INSERT INTO users")) {
          const newUser = {
            id: mockUsers.length + 1,
            email: params?.[0],
            password: params?.[1],
            role: params?.[2] || "USER",
          };
          mockUsers.push(newUser);
          return { rows: [newUser] };
        }
        return { rows: [] };
      }),
    } as any;

    app = express();
    app.use(express.json());
    app.use("/api/auth", createAuthRouter(mockPgClient));
  });

  test("POST /api/auth/register - Should register a new regular user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "student@uce.edu.ec",
        password: "securepassword123",
        role: "USER"
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("User registered successfully");
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe("student@uce.edu.ec");
    expect(response.body.user.role).toBe("USER");
    expect(response.body.user.passwordHash).toBeUndefined(); // Ensure no password leak
  });

  test("POST /api/auth/register - Should register an admin user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "admin@uce.edu.ec",
        password: "adminpassword123",
        role: "ADMIN"
      });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("ADMIN");
  });

  test("POST /api/auth/register - Should return 409 Conflict if user already exists", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "existing@uce.edu.ec",
        password: "password123"
      });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "existing@uce.edu.ec",
        password: "newpassword"
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("User with this email already exists");
  });

  test("POST /api/auth/register - Should return 400 Bad Request when email or password missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "onlyemail@uce.edu.ec" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Email and password are required");
  });

  test("POST /api/auth/login - Should login successfully and return JWT token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login@uce.edu.ec",
        password: "mypassword123",
        role: "USER"
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@uce.edu.ec",
        password: "mypassword123"
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe("login@uce.edu.ec");
  });

  test("POST /api/auth/login - Should return 401 Unauthorized for invalid password", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "login@uce.edu.ec",
        password: "correctpassword"
      });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@uce.edu.ec",
        password: "wrongpassword"
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password");
  });

  test("GET /api/auth/validate-token - Should validate a legitimate JWT token", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        email: "token@uce.edu.ec",
        password: "password123"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "token@uce.edu.ec",
        password: "password123"
      });

    const token = loginRes.body.token;

    const validateRes = await request(app)
      .get("/api/auth/validate-token")
      .set("Authorization", `Bearer ${token}`);

    expect(validateRes.status).toBe(200);
    expect(validateRes.body.valid).toBe(true);
    expect(validateRes.body.user.email).toBe("token@uce.edu.ec");
  });

  test("GET /api/auth/validate-token - Should reject requests without Bearer token", async () => {
    const validateRes = await request(app).get("/api/auth/validate-token");
    expect(validateRes.status).toBe(401);
    expect(validateRes.body.error).toBe("No token provided");
  });
});
