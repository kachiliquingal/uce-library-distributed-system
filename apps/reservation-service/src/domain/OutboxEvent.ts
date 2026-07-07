export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface OutboxEvent {
  id: string;
  aggregateType: 'Reservation' | 'StudyRoom';
  aggregateId: string;
  eventType: 'reservation.created' | 'reservation.cancelled' | 'reservation.expired' | 'room.status_changed';
  payload: Record<string, unknown>;
  status: OutboxStatus;
  createdAt: string;
  publishedAt?: string;
  error?: string;
}
