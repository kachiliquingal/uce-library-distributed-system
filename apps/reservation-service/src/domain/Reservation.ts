export type ReservationStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  roomId: string;
  roomName: string;
  faculty: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. 14:00)
  endTime: string; // HH:mm (e.g. 14:05)
  durationMinutes: number; // 5 minutes assigned
  status: ReservationStatus;
  purpose: string;
  attendees: number;
  createdAt: string; // ISO timestamp
  expiresAt?: number; // Epoch seconds for TTL / auto expiration
}
