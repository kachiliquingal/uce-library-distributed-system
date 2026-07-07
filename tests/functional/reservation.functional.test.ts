import request from "supertest";
import express from "express";
import { createRoutes } from "../../apps/reservation-service/src/infrastructure/http/routes";
import { ReservationController } from "../../apps/reservation-service/src/infrastructure/http/controllers/ReservationController";
import { CreateReservationWithOutboxUseCase } from "../../apps/reservation-service/src/application/use-cases/CreateReservationWithOutboxUseCase";
import { GetReservationsUseCase } from "../../apps/reservation-service/src/application/use-cases/GetReservationsUseCase";
import { CancelReservationUseCase } from "../../apps/reservation-service/src/application/use-cases/CancelReservationUseCase";
import { GetRoomsAvailabilityUseCase } from "../../apps/reservation-service/src/application/use-cases/GetRoomsAvailabilityUseCase";

let mockRooms: any[] = [];
let mockReservations: any[] = [];

class MockReservationRepository {
  async getRooms() {
    return mockRooms;
  }
  async getRoomById(id: string) {
    return mockRooms.find((r) => r.id === id) || null;
  }
  async findActiveByUser(userId: string) {
    return mockReservations.filter((r) => r.userId === userId && r.status === "ACTIVE");
  }
  async createWithOutbox(reservation: any, roomUpdate: any, outboxEvent: any) {
    mockReservations.push(reservation);
    const room = mockRooms.find((r) => r.id === reservation.roomId);
    if (room) {
      room.currentStatus = roomUpdate.currentStatus;
      room.activeReservationId = roomUpdate.activeReservationId;
    }
  }
  async markOutboxPublished(eventId: string) {}
  async findById(id: string) {
    return mockReservations.find((r) => r.id === id) || null;
  }
  async updateStatusWithOutbox(resId: string, status: any, roomId: string, roomStatus: any, outbox: any) {
    const res = mockReservations.find((r) => r.id === resId);
    if (res) res.status = status;
    const room = mockRooms.find((r) => r.id === roomId);
    if (room) {
      room.currentStatus = roomStatus;
      delete room.activeReservationId;
    }
  }
  async findByUser(userId: string) {
    return mockReservations.filter((r) => r.userId === userId);
  }
  async findByRoomAndDate(roomId: string, date: string) {
    return mockReservations.filter((r) => r.roomId === roomId && r.date === date);
  }
  async findAll() {
    return mockReservations;
  }
}

class MockBroker {
  async publishKafka() {}
  async publishMqtt() {}
}

describe("Reservation Service Functional Integration Tests (Supertest)", () => {
  let app: express.Application;
  let todayStr: string;

  beforeEach(() => {
    mockRooms = [
      {
        id: "room-101",
        name: "Sala de Lectura Silenciosa",
        faculty: "Ingeniería",
        capacity: 4,
        currentStatus: "AVAILABLE",
      },
      {
        id: "room-102",
        name: "Sala de Estudio Grupal",
        faculty: "Ciencias",
        capacity: 6,
        currentStatus: "AVAILABLE",
      },
    ];
    mockReservations = [];

    const nowEcuador = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
    todayStr = nowEcuador.toISOString().split("T")[0];

    const mockRepo = new MockReservationRepository() as any;
    const mockBroker = new MockBroker() as any;

    const createUseCase = new CreateReservationWithOutboxUseCase(mockRepo, mockBroker);
    const getUseCase = new GetReservationsUseCase(mockRepo);
    const cancelUseCase = new CancelReservationUseCase(mockRepo, mockBroker);
    const roomsUseCase = new GetRoomsAvailabilityUseCase(mockRepo);

    const controller = new ReservationController(createUseCase, getUseCase, cancelUseCase, roomsUseCase);

    app = express();
    app.use(express.json());
    app.use("/api/reservations", createRoutes(controller));
  });

  test("GET /api/reservations/rooms - Should retrieve study rooms catalog", async () => {
    const res = await request(app).get("/api/reservations/rooms");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe("Sala de Lectura Silenciosa");
  });

  test("POST /api/reservations - Should create a 5-minute study room reservation successfully", async () => {
    const res = await request(app)
      .post("/api/reservations")
      .send({
        userId: "user-100",
        roomId: "room-101",
        date: todayStr,
        startTime: "14:00",
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe("user-100");
    expect(res.body.roomId).toBe("room-101");
    expect(res.body.durationMinutes).toBe(5);
    expect(res.body.status).toBe("ACTIVE");
  });

  test("POST /api/reservations - Should return 400 if user already has an active reservation", async () => {
    await request(app)
      .post("/api/reservations")
      .send({
        userId: "user-100",
        roomId: "room-101",
        date: todayStr,
        startTime: "14:00",
      });

    const res2 = await request(app)
      .post("/api/reservations")
      .send({
        userId: "user-100",
        roomId: "room-102",
        date: todayStr,
        startTime: "15:00",
      });

    expect(res2.status).toBe(400);
    expect(res2.body.error).toContain("Ya tienes una reserva activa en curso");
  });

  test("GET /api/reservations - Should retrieve reservations by userId", async () => {
    await request(app)
      .post("/api/reservations")
      .send({
        userId: "user-100",
        roomId: "room-101",
        date: todayStr,
        startTime: "14:00",
      });

    const res = await request(app).get("/api/reservations?userId=user-100");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].roomId).toBe("room-101");
  });

  test("DELETE /api/reservations/:id - Should cancel reservation and free room", async () => {
    const createRes = await request(app)
      .post("/api/reservations")
      .send({
        userId: "user-100",
        roomId: "room-101",
        date: todayStr,
        startTime: "14:00",
      });
    const resId = createRes.body.id;

    const delRes = await request(app).delete(`/api/reservations/${resId}`).send({ userId: "user-100" });
    expect(delRes.status).toBe(200);
    expect(delRes.body.message).toBe("Reserva cancelada y sala liberada exitosamente");

    const checkRooms = await request(app).get("/api/reservations/rooms");
    expect(checkRooms.body[0].currentStatus).toBe("AVAILABLE");
  });
});
