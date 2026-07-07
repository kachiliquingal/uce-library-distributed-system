import { CreateReservationWithOutboxUseCase } from '../src/application/use-cases/CreateReservationWithOutboxUseCase';
import { GetReservationsUseCase } from '../src/application/use-cases/GetReservationsUseCase';
import { CancelReservationUseCase } from '../src/application/use-cases/CancelReservationUseCase';
import { GetRoomsAvailabilityUseCase } from '../src/application/use-cases/GetRoomsAvailabilityUseCase';
import { IReservationRepository } from '../src/domain/IReservationRepository';
import { IMessageBroker } from '../src/domain/IMessageBroker';
import { StudyRoom } from '../src/domain/StudyRoom';
import { Reservation, ReservationStatus } from '../src/domain/Reservation';
import { OutboxEvent } from '../src/domain/OutboxEvent';

class MockReservationRepository implements IReservationRepository {
  public rooms: StudyRoom[] = [
    {
      id: 'room-adm-1',
      name: 'Sala de Lectura Silenciosa - Administrativas',
      faculty: 'Facultad de Ciencias Administrativas',
      type: 'QUIET_READING',
      capacity: 6,
      location: 'Edificio Central - Piso 2',
      amenities: ['Wi-Fi 6', 'Pizarra acrílica', 'Aire acondicionado'],
      currentStatus: 'AVAILABLE',
      activeReservationId: undefined
    },
    {
      id: 'room-adm-2',
      name: 'Sala Multimedia - Administrativas',
      faculty: 'Facultad de Ciencias Administrativas',
      type: 'GROUP_MULTIMEDIA',
      capacity: 8,
      location: 'Edificio Central - Piso 3',
      amenities: ['Proyector 4K', 'Audio envolvente'],
      currentStatus: 'AVAILABLE',
      activeReservationId: undefined
    }
  ];
  public reservations: Reservation[] = [];
  public outbox: OutboxEvent[] = [];

  async getRooms(): Promise<StudyRoom[]> {
    return this.rooms;
  }
  async getRoomById(roomId: string): Promise<StudyRoom | null> {
    return this.rooms.find(r => r.id === roomId) || null;
  }
  async createWithOutbox(
    reservation: Reservation,
    roomUpdate: Partial<StudyRoom>,
    outboxEvent: OutboxEvent
  ): Promise<void> {
    this.reservations.push(reservation);
    const room = this.rooms.find(r => r.id === reservation.roomId);
    if (room && roomUpdate.currentStatus) {
      room.currentStatus = roomUpdate.currentStatus;
      room.activeReservationId = roomUpdate.activeReservationId;
    }
    this.outbox.push(outboxEvent);
  }
  async findById(reservationId: string): Promise<Reservation | null> {
    return this.reservations.find(r => r.id === reservationId) || null;
  }
  async findByUser(userId: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.userId === userId);
  }
  async findActiveByUser(userId: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.userId === userId && r.status === 'ACTIVE');
  }
  async findByRoomAndDate(roomId: string, date: string): Promise<Reservation[]> {
    return this.reservations.filter(r => r.roomId === roomId && r.date === date);
  }
  async findAll(): Promise<Reservation[]> {
    return this.reservations;
  }
  async findActiveExpired(currentEpochSeconds: number): Promise<Reservation[]> {
    return this.reservations.filter(r => r.status === 'ACTIVE' && r.expiresAt !== undefined && r.expiresAt <= currentEpochSeconds);
  }
  async updateStatusWithOutbox(
    reservationId: string,
    status: ReservationStatus,
    roomId: string,
    roomStatus: StudyRoom['currentStatus'],
    outboxEvent: OutboxEvent
  ): Promise<void> {
    const res = this.reservations.find(r => r.id === reservationId);
    if (res) res.status = status;
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.currentStatus = roomStatus;
      if (roomStatus === 'AVAILABLE') room.activeReservationId = undefined;
    }
    this.outbox.push(outboxEvent);
  }
  async updateRoomStatus(roomId: string, status: StudyRoom['currentStatus'], activeReservationId?: string): Promise<void> {
    const room = this.rooms.find(r => r.id === roomId);
    if (room) {
      room.currentStatus = status;
      room.activeReservationId = activeReservationId;
    }
  }
  async getPendingOutboxEvents(): Promise<OutboxEvent[]> {
    return this.outbox.filter(e => e.status === 'PENDING');
  }
  async markOutboxPublished(eventId: string): Promise<void> {
    const evt = this.outbox.find(e => e.id === eventId);
    if (evt) {
      evt.status = 'PUBLISHED';
      evt.publishedAt = new Date().toISOString();
    }
  }
}

class MockMessageBroker implements IMessageBroker {
  public publishedKafka: { topic: string; message: any }[] = [];
  public publishedMqtt: { topic: string; payload: any }[] = [];

  async publishKafka(topic: string, message: any): Promise<void> {
    this.publishedKafka.push({ topic, message });
  }
  async publishMqtt(topic: string, payload: any): Promise<void> {
    this.publishedMqtt.push({ topic, payload });
  }
  async close(): Promise<void> {}
}

describe("Reservation Service Unit Tests", () => {
  test("Reservation ACID 3-operation and Outbox Use Cases", async () => {
    const repo = new MockReservationRepository();
    const broker = new MockMessageBroker();

    const createUseCase = new CreateReservationWithOutboxUseCase(repo, broker);
    const getReservationsUseCase = new GetReservationsUseCase(repo);
    const cancelUseCase = new CancelReservationUseCase(repo, broker);
    const getRoomsUseCase = new GetRoomsAvailabilityUseCase(repo);

    const rooms = await getRoomsUseCase.execute();
    expect(rooms.length).toBe(2);
    expect(rooms[0].currentStatus).toBe('AVAILABLE');

    const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const todayStr = nowEcuador.toISOString().split('T')[0];

    const reservation = await createUseCase.execute({
      userId: 'user-001',
      userEmail: 'estudiante@uce.edu.ec',
      userName: 'Alejandro Estudiante',
      roomId: 'room-adm-1',
      date: todayStr,
      startTime: '10:00',
      purpose: 'Estudio individual',
      attendees: 1
    });

    expect(reservation.durationMinutes).toBe(5);
    expect(reservation.endTime).toBe('10:05');
    expect(repo.reservations.length).toBe(1);
    expect(repo.rooms[0].currentStatus).toBe('RESERVED');
    expect(repo.outbox.length).toBe(1);
    expect(repo.outbox[0].eventType).toBe('reservation.created');

    await expect(createUseCase.execute({
      userId: 'user-001',
      userEmail: 'estudiante@uce.edu.ec',
      userName: 'Alejandro Estudiante',
      roomId: 'room-adm-2',
      date: todayStr,
      startTime: '11:00'
    })).rejects.toThrow(/reserva activa/);

    await expect(createUseCase.execute({
      userId: 'user-002',
      userEmail: 'otro@uce.edu.ec',
      userName: 'Otro Estudiante',
      roomId: 'room-adm-2',
      date: '2028-01-01',
      startTime: '14:00'
    })).rejects.toThrow(/solo están permitidas para el día de hoy/);

    const list = await getReservationsUseCase.execute({ userId: 'user-001' });
    expect(list.length).toBe(1);

    await cancelUseCase.execute(reservation.id, 'user-001', false);
    expect(repo.reservations[0].status).toBe('CANCELLED');
    expect(repo.rooms[0].currentStatus).toBe('AVAILABLE');
    expect(repo.outbox.length).toBe(2);
  });
});
