import { IReservationRepository } from '../../domain/IReservationRepository';
import { StudyRoom } from '../../domain/StudyRoom';

export class GetRoomsAvailabilityUseCase {
  constructor(private repository: IReservationRepository) {}

  async execute(date?: string, faculty?: string): Promise<StudyRoom[]> {
    const rooms = await this.repository.getRooms();
    if (faculty && faculty !== 'Todas las Facultades' && faculty !== 'all') {
      return rooms.filter(r => r.faculty.toLowerCase() === faculty.toLowerCase());
    }
    return rooms;
  }
}
