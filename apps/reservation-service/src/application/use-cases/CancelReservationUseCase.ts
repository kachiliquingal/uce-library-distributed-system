import { IReservationRepository } from '../../domain/IReservationRepository';
import { IMessageBroker } from '../../domain/IMessageBroker';
import { OutboxEvent } from '../../domain/OutboxEvent';
import { logger } from '../../utils/logger';

export class CancelReservationUseCase {
  constructor(
    private repository: IReservationRepository,
    private broker: IMessageBroker
  ) {}

  async execute(reservationId: string, userId: string, isAdmin = false): Promise<void> {
    const res = await this.repository.findById(reservationId);
    if (!res) {
      throw new Error(`La reserva ${reservationId} no existe.`);
    }
    if (res.status !== 'ACTIVE') {
      throw new Error(`La reserva ${reservationId} ya se encuentra en estado ${res.status}.`);
    }
    if (!isAdmin && res.userId !== userId) {
      throw new Error('No tienes permisos para cancelar esta reserva.');
    }

    const outboxEvent: OutboxEvent = {
      id: `evt-can-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      aggregateType: 'Reservation',
      aggregateId: res.id,
      eventType: 'reservation.cancelled',
      payload: {
        reservationId: res.id,
        userId: res.userId,
        userEmail: res.userEmail,
        userName: res.userName,
        roomId: res.roomId,
        roomName: res.roomName,
        faculty: res.faculty,
        roomStatus: 'AVAILABLE',
        message: `La reserva en la ${res.roomName} ha sido cancelada. La sala ha quedado liberada.`
      },
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // Execute ACID 3-operation transaction
    await this.repository.updateStatusWithOutbox(
      res.id,
      'CANCELLED',
      res.roomId,
      'AVAILABLE',
      outboxEvent
    );

    try {
      await this.broker.publishKafka('reservation.cancelled', outboxEvent.payload);
      await this.broker.publishMqtt(`library/rooms/${res.roomId}/status`, {
        roomId: res.roomId,
        status: 'AVAILABLE',
        updatedAt: new Date().toISOString()
      });
    } catch {
      logger.debug('Instant publish fallback to outbox interval');
    }

    logger.info(`🚫 Reserva ${res.id} cancelada. ${res.roomName} liberada a estado DISPONIBLE.`);
  }
}
