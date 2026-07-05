import { Reservation, ReservationStatus } from './Reservation';
import { StudyRoom } from './StudyRoom';
import { OutboxEvent } from './OutboxEvent';

export interface IReservationRepository {
  // ACID 3-Operation Composite Transaction (Put Reservation, Update Room, Put Outbox)
  createWithOutbox(reservation: Reservation, roomUpdate: Partial<StudyRoom>, outboxEvent: OutboxEvent): Promise<void>;
  
  // ACID 3-Operation Transaction for Cancellation & Expiration
  updateStatusWithOutbox(
    reservationId: string,
    newStatus: ReservationStatus,
    roomId: string,
    roomStatus: StudyRoom['currentStatus'],
    outboxEvent: OutboxEvent
  ): Promise<void>;

  // Reservation Queries
  findById(id: string): Promise<Reservation | null>;
  findByUser(userId: string): Promise<Reservation[]>;
  findByRoomAndDate(roomId: string, date: string): Promise<Reservation[]>;
  findAll(): Promise<Reservation[]>;
  findActiveExpired(currentEpochSeconds: number): Promise<Reservation[]>;
  findActiveByUser(userId: string): Promise<Reservation[]>;

  // Room Queries
  getRooms(): Promise<StudyRoom[]>;
  getRoomById(id: string): Promise<StudyRoom | null>;
  updateRoomStatus(roomId: string, status: StudyRoom['currentStatus'], activeReservationId?: string): Promise<void>;

  // Outbox Queries
  getPendingOutboxEvents(): Promise<OutboxEvent[]>;
  markOutboxPublished(eventId: string): Promise<void>;
}
