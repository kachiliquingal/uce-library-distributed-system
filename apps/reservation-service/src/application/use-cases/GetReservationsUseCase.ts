import { IReservationRepository } from '../../domain/IReservationRepository';
import { Reservation } from '../../domain/Reservation';

export class GetReservationsUseCase {
  constructor(private repository: IReservationRepository) {}

  async execute(filters: { userId?: string; roomId?: string; date?: string }): Promise<Reservation[]> {
    if (filters.userId) {
      return this.repository.findByUser(filters.userId);
    }
    if (filters.roomId && filters.date) {
      return this.repository.findByRoomAndDate(filters.roomId, filters.date);
    }
    return this.repository.findAll();
  }
}
