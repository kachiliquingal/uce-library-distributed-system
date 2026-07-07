import { IReservationRepository } from '../../domain/IReservationRepository';
import { IMessageBroker } from '../../domain/IMessageBroker';
import { OutboxEvent } from '../../domain/OutboxEvent';
import { logger } from '../../utils/logger';

export class ReservationExpirationWorker {
  private intervalId?: NodeJS.Timeout;
  private isChecking = false;

  constructor(
    private repository: IReservationRepository,
    private broker: IMessageBroker
  ) {}

  start(intervalMs = 10000) {
    logger.info(`⏰ Iniciando ReservationExpirationWorker (Liberación automática al cumplir 5 minutos) cada ${intervalMs}ms...`);
    this.intervalId = setInterval(() => this.checkExpiredReservations(), intervalMs);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async checkExpiredReservations() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiredList = await this.repository.findActiveExpired(nowSeconds);

      if (expiredList.length === 0) {
        this.isChecking = false;
        return;
      }

      logger.info(`⏰ [Liberación Automática] Se detectaron ${expiredList.length} reservas que cumplieron sus 5 minutos asignados.`);

      for (const res of expiredList) {
        try {
          const outboxEvent: OutboxEvent = {
            id: `evt-exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            aggregateType: 'Reservation',
            aggregateId: res.id,
            eventType: 'reservation.expired',
            payload: {
              reservationId: res.id,
              userId: res.userId,
              userEmail: res.userEmail,
              userName: res.userName,
              roomId: res.roomId,
              roomName: res.roomName,
              faculty: res.faculty,
              roomStatus: 'AVAILABLE',
              message: `Tu tiempo asignado de 5 minutos en la ${res.roomName} ha terminado. Por favor abandona la sala para el siguiente turno.`
            },
            status: 'PENDING',
            createdAt: new Date().toISOString()
          };

          // Execute ACID 3-operation transaction to mark COMPLETED and release room to AVAILABLE
          await this.repository.updateStatusWithOutbox(
            res.id,
            'COMPLETED',
            res.roomId,
            'AVAILABLE',
            outboxEvent
          );

          // Also publish immediately to Kafka and MQTT for instant notification bell & email trigger
          await this.broker.publishKafka('reservation.expired', outboxEvent.payload);
          await this.broker.publishMqtt(`library/rooms/${res.roomId}/status`, {
            roomId: res.roomId,
            status: 'AVAILABLE',
            updatedAt: new Date().toISOString()
          });
          await this.repository.markOutboxPublished(outboxEvent.id);

          logger.info(`✅ [Sala Liberada] Reserva ${res.id} completada. ${res.roomName} ahora está DISPONIBLE en tiempo real.`);
        } catch (err) {
          logger.error(`❌ Error al expirar reserva ${res.id}:`, err);
        }
      }
    } catch (err) {
      logger.error('❌ Error revisando reservas expiradas:', err);
    } finally {
      this.isChecking = false;
    }
  }
}
