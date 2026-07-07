import request from "supertest";
import express from "express";
import { Notification } from "../../apps/notification-service/src/domain/entities/Notification";

let mockNotifications: Notification[] = [];

jest.mock("../../apps/notification-service/src/infrastructure/database/PostgresNotificationRepository", () => {
  return {
    PostgresNotificationRepository: class {
      async save(notification: Notification): Promise<void> {
        mockNotifications.push(notification);
      }
      async findByUserId(userId: string): Promise<Notification[]> {
        return mockNotifications.filter((n) => n.userId === userId);
      }
      async findAll(): Promise<Notification[]> {
        return mockNotifications;
      }
      async updateStatus(id: string, status: any): Promise<void> {
        const found = mockNotifications.find((n) => n.id === id || n.userId === id);
        if (found) {
          found.status = status;
        }
      }
    },
  };
});

import { notificationRouter } from "../../apps/notification-service/src/infrastructure/http/routes";

describe("Notification Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;

  beforeEach(() => {
    mockNotifications = [
      {
        id: "notif-1",
        userId: "user-100",
        type: "EMAIL",
        subject: "Préstamo Exitoso",
        message: "Has pedido prestado Clean Code",
        status: "PENDING",
        createdAt: new Date(),
      },
      {
        id: "notif-2",
        userId: "user-100",
        type: "SYSTEM",
        subject: "Recordatorio de Devolución",
        message: "Tu préstamo vence mañana",
        status: "PENDING",
        createdAt: new Date(),
      },
      {
        id: "notif-3",
        userId: "user-200",
        type: "EMAIL",
        subject: "Multa Generada",
        message: "Tienes una multa de $5",
        status: "PENDING",
        createdAt: new Date(),
      },
    ];
    app = express();
    app.use(express.json());
    app.use("/api/notifications", notificationRouter);
  });

  test("GET /api/notifications - Should retrieve all system notifications", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body[0].subject).toBe("Préstamo Exitoso");
  });

  test("GET /api/notifications/user/:userId - Should retrieve notifications for a specific user", async () => {
    const res = await request(app).get("/api/notifications/user/user-100");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body.every((n: any) => n.userId === "user-100")).toBe(true);
  });

  test("GET /api/notifications/user/:userId - Should return empty array for user without notifications", async () => {
    const res = await request(app).get("/api/notifications/user/user-999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("PUT /api/notifications/user/:userId/read - Should mark user notifications as read", async () => {
    const res = await request(app).put("/api/notifications/user/user-100/read");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Notifications marked as read");
  });
});
