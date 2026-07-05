import assert from 'assert';
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

async function runTests() {
  console.log('🧪 Iniciando pruebas unitarias para reservation-service...');

  const repo = new MockReservationRepository();
  const broker = new MockMessageBroker();

  const createUseCase = new CreateReservationWithOutboxUseCase(repo, broker);
  const getReservationsUseCase = new GetReservationsUseCase(repo);
  const cancelUseCase = new CancelReservationUseCase(repo, broker);
  const getRoomsUseCase = new GetRoomsAvailabilityUseCase(repo);

  try {
    // 1. Test Get Rooms
    const rooms = await getRoomsUseCase.execute();
    assert.strictEqual(rooms.length, 2, 'Debe retornar el catálogo de salas');
    assert.strictEqual(rooms[0].currentStatus, 'AVAILABLE', 'Sala debe iniciar DISPONIBLE');

    // 2. Calculate Today in America/Guayaquil YYYY-MM-DD
    const nowEcuador = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
    const todayStr = nowEcuador.toISOString().split('T')[0];

    // 3. Test Create Reservation with ACID 3-operation & 5-minute duration
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

    assert.strictEqual(reservation.durationMinutes, 5, 'Duración asignada debe ser exactamente 5 minutos');
    assert.strictEqual(reservation.endTime, '10:05', 'Hora de fin debe calcularse sumando 5 minutos');
    assert.strictEqual(repo.reservations.length, 1, 'Reserva debe guardarse en el repositorio');
    assert.strictEqual(repo.rooms[0].currentStatus, 'RESERVED', 'Estado de la sala debe actualizarse en la transacción ACID');
    assert.strictEqual(repo.outbox.length, 1, 'Evento Outbox debe registrarse de forma atómica en la misma transacción');
    assert.strictEqual(repo.outbox[0].eventType, 'reservation.created');

    // 4. Test Enforcing One Active Reservation Per User
    let activeError = null;
    try {
      await createUseCase.execute({
        userId: 'user-001',
        userEmail: 'estudiante@uce.edu.ec',
        userName: 'Alejandro Estudiante',
        roomId: 'room-adm-2',
        date: todayStr,
        startTime: '11:00'
      });
    } catch (err: any) {
      activeError = err.message;
    }
    assert.ok(activeError && activeError.includes('reserva activa'), 'Debe impedir reservas múltiples simultáneas');

    // 5. Test Enforcing Today/Tomorrow Rule (Reject date > 24 hours ahead)
    let dateError = null;
    try {
      await createUseCase.execute({
        userId: 'user-002',
        userEmail: 'otro@uce.edu.ec',
        userName: 'Otro Estudiante',
        roomId: 'room-adm-2',
        date: '2028-01-01',
        startTime: '14:00'
      });
    } catch (err: any) {
      dateError = err.message;
    }
    assert.ok(dateError && dateError.includes('solo están permitidas para el día de hoy'), 'Debe impedir reservas con más de 24 horas de anticipación');

    // 6. Test Get Reservations
    const list = await getReservationsUseCase.execute({ userId: 'user-001' });
    assert.strictEqual(list.length, 1, 'Debe retornar las reservas del usuario');

    // 7. Test Cancel Reservation and Release Room via MQTT
    await cancelUseCase.execute(reservation.id, 'user-001', false);
    assert.strictEqual(repo.reservations[0].status, 'CANCELLED', 'Estado de reserva debe cambiar a CANCELADO');
    assert.strictEqual(repo.rooms[0].currentStatus, 'AVAILABLE', 'La sala debe quedar liberada a estado DISPONIBLE');
    assert.strictEqual(repo.outbox.length, 2, 'Debe registrarse evento Outbox de cancelación');

    console.log('✅ ¡Todas las pruebas unitarias de reservation-service superadas con éxito!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Fallo en las pruebas unitarias:', err);
    process.exit(1);
  }
}

runTests();
