import request from "supertest";
import express from "express";

let mockUsers: any[] = [];
let idCounter = 1;

jest.mock("../../apps/user-service/src/infrastructure/neo4j/Neo4jUserRepository", () => {
  return {
    Neo4jUserRepository: class {
      async getUserByEmail(email: string) {
        return mockUsers.find((u) => u.email === email) || null;
      }
      async getUserById(id: string) {
        return mockUsers.find((u) => u.id === id) || null;
      }
      async getAllUsers() {
        return mockUsers;
      }
      async createUser(data: any) {
        const newUser = {
          id: data.id || `user-${idCounter++}`,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roles: [{ id: "role-user", name: "USER", permissions: ["READ_BOOKS", "BORROW_BOOKS"] }],
        };
        mockUsers.push(newUser);
        return newUser;
      }
      async assignRoleToUser(userId: string, roleName: string) {
        const user = mockUsers.find((u) => u.id === userId);
        if (user) {
          user.roles = [
            {
              id: `role-${roleName.toLowerCase()}`,
              name: roleName,
              permissions:
                roleName === "ADMIN"
                  ? ["READ_BOOKS", "BORROW_BOOKS", "MANAGE_CATALOG", "MANAGE_USERS"]
                  : ["READ_BOOKS", "BORROW_BOOKS"],
            },
          ];
        }
      }
    },
  };
});

jest.mock("../../apps/user-service/src/infrastructure/kafka/KafkaProducer", () => ({
  KafkaProducer: {
    getInstance: jest.fn().mockReturnValue({
      emitEvent: jest.fn().mockResolvedValue(undefined),
      connect: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { router as userRouter } from "../../apps/user-service/src/infrastructure/http/routes";

describe("User Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockUsers = [];
    idCounter = 1;
    app = express();
    app.use(express.json());
    app.use("/api/users", userRouter);
  });

  const sampleUser = {
    email: "test.user@uce.edu.ec",
    firstName: "Alejandro",
    lastName: "Estudiante",
    isActive: true,
  };

  test("POST /api/users - Should create a new user successfully", async () => {
    const res = await request(app).post("/api/users").send(sampleUser);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(sampleUser.email);
    expect(res.body.id).toBeDefined();
    expect(res.body.roles[0].name).toBe("USER");
  });

  test("POST /api/users - Should return 409 Conflict if user already exists", async () => {
    await request(app).post("/api/users").send(sampleUser);
    const res = await request(app).post("/api/users").send(sampleUser);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("User already exists with this email");
  });

  test("GET /api/users - Should retrieve all users", async () => {
    await request(app).post("/api/users").send(sampleUser);
    await request(app).post("/api/users").send({
      ...sampleUser,
      email: "second.user@uce.edu.ec",
    });

    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test("GET /api/users/:id - Should retrieve user by ID", async () => {
    const createRes = await request(app).post("/api/users").send(sampleUser);
    const userId = createRes.body.id;

    const res = await request(app).get(`/api/users/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe(sampleUser.email);
  });

  test("GET /api/users/:id - Should return 404 for non-existent user ID", async () => {
    const res = await request(app).get("/api/users/non-existent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("PUT /api/users/:id/roles - Should assign role to user", async () => {
    const createRes = await request(app).post("/api/users").send(sampleUser);
    const userId = createRes.body.id;

    const res = await request(app)
      .put(`/api/users/${userId}/roles`)
      .send({ roleName: "ADMIN" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Role assigned successfully");

    const getRes = await request(app).get(`/api/users/${userId}`);
    expect(getRes.body.roles[0].name).toBe("ADMIN");
  });

  test("GET /api/users/:id/permissions - Should retrieve user permissions", async () => {
    const createRes = await request(app).post("/api/users").send(sampleUser);
    const userId = createRes.body.id;

    const res = await request(app).get(`/api/users/${userId}/permissions`);
    expect(res.status).toBe(200);
    expect(res.body.permissions).toContain("READ_BOOKS");
    expect(res.body.permissions).toContain("BORROW_BOOKS");
  });
});
